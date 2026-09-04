CREATE OR REPLACE FUNCTION reserve_camera_upload(
  p_guest_id uuid,
  p_guest_name text DEFAULT NULL,
  p_storage_key text DEFAULT NULL,
  p_storage_url text DEFAULT NULL,
  p_upload_id uuid DEFAULT NULL
)
RETURNS TABLE(
  id uuid,
  storage_key text,
  upload_state text,
  taken integer,
  remaining integer,
  shot_limit integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
#variable_conflict use_column
DECLARE
  v_limit CONSTANT integer := 24;
  v_ttl CONSTANT interval := interval '15 minutes';
  v_taken integer;
  v_id uuid;
  v_storage_key text;
  v_upload_state text;
  v_deleted_at timestamptz;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended(p_guest_id::text, 0));

  UPDATE camera_uploads AS cu
  SET upload_state = 'abandoned', deleted_at = COALESCE(cu.deleted_at, now())
  WHERE cu.guest_id = p_guest_id
    AND cu.upload_state = 'pending'
    AND cu.created_at < now() - v_ttl;

  SELECT count(*) INTO v_taken
  FROM camera_uploads AS cu
  WHERE cu.guest_id = p_guest_id AND cu.deleted_at IS NULL;

  IF p_upload_id IS NULL THEN
    RETURN QUERY SELECT NULL::uuid, NULL::text, NULL::text, v_taken,
      GREATEST(0, v_limit - v_taken), v_limit;
    RETURN;
  END IF;

  SELECT cu.id, cu.storage_key, cu.upload_state, cu.deleted_at
  INTO v_id, v_storage_key, v_upload_state, v_deleted_at
  FROM camera_uploads AS cu
  WHERE cu.guest_id = p_guest_id AND cu.upload_id = p_upload_id
  LIMIT 1;

  IF FOUND THEN
    IF v_upload_state = 'abandoned' THEN
      IF v_taken >= v_limit THEN
        RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'SHOT_LIMIT_REACHED';
      END IF;
      UPDATE camera_uploads AS cu
      SET upload_state = 'pending',
          deleted_at = NULL,
          created_at = now(),
          guest_name = NULLIF(left(trim(p_guest_name), 40), '')
      WHERE cu.id = v_id;
      v_upload_state := 'pending';
      v_taken := v_taken + 1;
    END IF;

    RETURN QUERY SELECT v_id, v_storage_key, v_upload_state, v_taken,
      GREATEST(0, v_limit - v_taken), v_limit;
    RETURN;
  END IF;

  IF p_storage_key IS NULL OR p_storage_url IS NULL THEN
    RAISE EXCEPTION USING ERRCODE = '22004', MESSAGE = 'UPLOAD_STORAGE_REQUIRED';
  END IF;
  IF v_taken >= v_limit THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'SHOT_LIMIT_REACHED';
  END IF;

  INSERT INTO camera_uploads (
    guest_id, guest_name, storage_key, url, status, upload_state, upload_id
  ) VALUES (
    p_guest_id,
    NULLIF(left(trim(p_guest_name), 40), ''),
    p_storage_key,
    p_storage_url,
    'pending',
    'pending',
    p_upload_id
  ) RETURNING camera_uploads.id INTO v_id;

  v_taken := v_taken + 1;
  RETURN QUERY SELECT v_id, p_storage_key, 'pending'::text, v_taken,
    GREATEST(0, v_limit - v_taken), v_limit;
END;
$$;

REVOKE ALL ON FUNCTION reserve_camera_upload(uuid, text, text, text, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION reserve_camera_upload(uuid, text, text, text, uuid) TO service_role;
