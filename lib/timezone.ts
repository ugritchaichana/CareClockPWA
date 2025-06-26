// Timezone utilities for CareClock PWA
// All users are in Thailand, so we use Asia/Bangkok timezone consistently
export const THAILAND_TIMEZONE = 'Asia/Bangkok'

/**
 * Format a Date object or ISO string to HH:mm format in Thailand timezone
 */
export function formatTimeToHHMM(dateTime: string | Date, timezone: string = THAILAND_TIMEZONE): string {
  try {
    const date = typeof dateTime === 'string' ? new Date(dateTime) : dateTime
    
    if (isNaN(date.getTime())) {
      console.error('Invalid date for formatting:', dateTime)
      return '00:00'
    }
    
    return date.toLocaleTimeString('th-TH', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false,
      timeZone: timezone
    })
  } catch (error) {
    console.error('Error formatting time:', error, 'Input:', dateTime)
    return '00:00'
  }
}

/**
 * Create a Date object from HH:mm time string for today in Thailand timezone
 */
export function createDateFromTimeString(timeString: string): Date {
  try {
    const [hours, minutes] = timeString.split(':').map(Number)
    
    if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
      throw new Error(`Invalid time format: ${timeString}`)
    }
    
    const today = new Date()
    const date = new Date(today.getFullYear(), today.getMonth(), today.getDate(), hours, minutes, 0)
    
    return date
  } catch (error) {
    console.error('Error creating date from time string:', error, 'Input:', timeString)
    throw error
  }
}

/**
 * Format date to display in Thailand timezone
 */
export function formatDateTimeForThailand(dateTime: string | Date, options?: {
  showDate?: boolean
  showTime?: boolean
}): string {
  const {
    showDate = false,
    showTime = true
  } = options || {}
  
  try {
    const date = typeof dateTime === 'string' ? new Date(dateTime) : dateTime
    
    if (isNaN(date.getTime())) {
      return 'Invalid Date'
    }
    
    const formatOptions: Intl.DateTimeFormatOptions = {
      timeZone: THAILAND_TIMEZONE
    }
    
    if (showDate) {
      formatOptions.year = 'numeric'
      formatOptions.month = '2-digit'
      formatOptions.day = '2-digit'
    }
    
    if (showTime) {
      formatOptions.hour = '2-digit'
      formatOptions.minute = '2-digit'
      formatOptions.hour12 = false
    }
    
    return date.toLocaleString('th-TH', formatOptions)
  } catch (error) {
    console.error('Error formatting datetime for Thailand:', error, 'Input:', dateTime)
    return 'Error'
  }
}
