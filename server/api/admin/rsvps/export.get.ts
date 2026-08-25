import ExcelJS from 'exceljs'
import { useSupabase } from '../../../utils/supabase'

const compareText = (a: string, b: string) => a.localeCompare(b, 'en', { sensitivity: 'base' })

function styleWorksheet(sheet: ExcelJS.Worksheet, widths: number[], filter = true) {
  sheet.views = [{ state: 'frozen', ySplit: 1 }]
  if (filter) sheet.autoFilter = { from: 'A1', to: `${sheet.getColumn(widths.length).letter}1` }
  sheet.columns.forEach((column, index) => {
    column.width = widths[index]
    column.alignment = { vertical: 'top', wrapText: true }
  })

  const header = sheet.getRow(1)
  header.height = 24
  header.font = { bold: true, color: { argb: 'FFFFFFFF' } }
  header.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563EB' } }
  header.alignment = { vertical: 'middle' }

  sheet.eachRow((row, rowNumber) => {
    const firstValue = String(row.getCell(1).value || '')
    const lastValue = String(row.getCell(widths.length).value || '')
    if (rowNumber > 1 && rowNumber % 2 === 1 && firstValue !== 'KIDS' && lastValue !== 'declined') {
      row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEFF6FF' } }
    }
  })
}

function markDeclined(row: ExcelJS.Row) {
  row.font = { color: { argb: 'FF991B1B' } }
  row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } }
}

export default defineEventHandler(async (event) => {
  const sb = useSupabase()
  const { data, error } = await sb
    .from('rsvps')
    .select('*')
    .is('deleted_at', null)

  if (error) throw createError({ statusCode: 500, message: error.message })

  const rows = [...(data ?? [])].sort((a: any, b: any) => {
    const declinedOrder = Number(a.status === 'declined') - Number(b.status === 'declined')
    return declinedOrder || compareText(a.display_name || '', b.display_name || '')
  })

  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'Uno Admin'
  workbook.created = new Date()

  const parties = workbook.addWorksheet('Per Party')
  parties.addRow(['Party', 'Guests', 'Adults', 'Kids', 'Dietary Notes', 'Status'])

  for (const row of rows as any[]) {
    const guests = Array.isArray(row.guest_names) ? row.guest_names.filter(Boolean) : []
    const kids = Array.isArray(row.kids_names) ? row.kids_names.filter(Boolean) : []
    const headcount = Number(row.headcount) || guests.length || 1
    const partyRow = parties.addRow([
      row.display_name || '',
      guests.join(', '),
      Math.max(headcount - kids.length, 0),
      kids.length,
      row.dietary_notes || '',
      row.status || '',
    ])
    if (row.status === 'declined') markDeclined(partyRow)
  }
  styleWorksheet(parties, [24, 42, 10, 10, 30, 14])

  const guestsSheet = workbook.addWorksheet('Kids and Non-kids')
  guestsSheet.addRow(['NON-KIDS', 'PARTY', 'STATUS'])

  const individualGuests = (rows as any[]).flatMap((row) => {
    const names = Array.isArray(row.guest_names) && row.guest_names.filter(Boolean).length
      ? row.guest_names.filter(Boolean)
      : [row.display_name || 'Unnamed guest']
    const kidNames = new Set(
      (Array.isArray(row.kids_names) ? row.kids_names : []).map((name: string) => name.toLocaleLowerCase('en')),
    )
    return names.map((name: string) => ({
      type: kidNames.has(name.toLocaleLowerCase('en')) ? 'Kid' : 'Non-kid',
      party: row.display_name || '',
      name,
      status: row.status || '',
    }))
  })

  const sortGuests = (a: typeof individualGuests[number], b: typeof individualGuests[number]) =>
    Number(a.status === 'declined') - Number(b.status === 'declined') ||
    compareText(a.party, b.party) || compareText(a.name, b.name)

  for (const guest of individualGuests.filter(guest => guest.type === 'Non-kid').sort(sortGuests)) {
    const guestRow = guestsSheet.addRow([guest.name, guest.party, guest.status])
    if (guest.status === 'declined') markDeclined(guestRow)
  }

  guestsSheet.addRow([])
  const kidsHeader = guestsSheet.addRow(['KIDS', 'PARTY', 'STATUS'])
  kidsHeader.font = { bold: true, color: { argb: 'FFFFFFFF' } }
  kidsHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF59E0B' } }

  for (const guest of individualGuests.filter(guest => guest.type === 'Kid').sort(sortGuests)) {
    const guestRow = guestsSheet.addRow([guest.name, guest.party, guest.status])
    if (guest.status === 'declined') markDeclined(guestRow)
  }
  styleWorksheet(guestsSheet, [28, 28, 14], false)

  const buffer = await workbook.xlsx.writeBuffer()
  const date = new Date().toISOString().slice(0, 10)
  setHeader(event, 'Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  setHeader(event, 'Content-Disposition', `attachment; filename="rsvps-${date}.xlsx"`)
  setHeader(event, 'Cache-Control', 'no-store')
  return Buffer.from(buffer)
})
