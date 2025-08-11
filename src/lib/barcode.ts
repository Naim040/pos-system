export interface BarcodeOptions {
  format?: 'CODE128' | 'EAN13' | 'UPC' | 'CODE39' | 'ITF' | 'MSI'
  width?: number
  height?: number
  displayValue?: boolean
  fontSize?: number
  textMargin?: number
  margin?: number
  background?: string
  lineColor?: string
}

export function generateBarcode(text: string, options: BarcodeOptions = {}): string {
  const {
    format = 'CODE128',
    width = 2,
    height = 100,
    displayValue = true,
    fontSize = 12,
    textMargin = 2,
    margin = 10,
    background = '#ffffff',
    lineColor = '#000000'
  } = options

  const barcodeData = encodeBarcode(text, format)
  const svgWidth = (barcodeData.length * width) + (2 * margin)
  const svgHeight = height + (displayValue ? fontSize + textMargin : 0) + (2 * margin)

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}">
    <rect width="${svgWidth}" height="${svgHeight}" fill="${background}"/>`

  let xPosition = margin
  for (let i = 0; i < barcodeData.length; i++) {
    if (barcodeData[i] === '1') {
      svg += `<rect x="${xPosition}" y="${margin}" width="${width}" height="${height}" fill="${lineColor}"/>`
    }
    xPosition += width
  }

  if (displayValue) {
    const textY = margin + height + textMargin + fontSize
    svg += `<text x="${svgWidth / 2}" y="${textY}" text-anchor="middle" font-family="monospace" font-size="${fontSize}" fill="${lineColor}">${text}</text>`
  }

  svg += '</svg>'
  return svg
}

function encodeBarcode(text: string, format: string): string {
  switch (format) {
    case 'CODE128':
      return encodeCODE128(text)
    case 'EAN13':
      return encodeEAN13(text)
    case 'UPC':
      return encodeUPC(text)
    case 'CODE39':
      return encodeCODE39(text)
    case 'ITF':
      return encodeITF(text)
    case 'MSI':
      return encodeMSI(text)
    default:
      return encodeCODE128(text)
  }
}

function encodeCODE128(text: string): string {
  let encoded = ''
  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i)
    const binary = charCode.toString(2).padStart(8, '0')
    encoded += binary
  }
  return encoded
}

function encodeEAN13(text: string): string {
  const cleanText = text.replace(/[^0-9]/g, '').padStart(12, '0')
  let encoded = '101'
  
  for (let i = 0; i < cleanText.length; i++) {
    const digit = parseInt(cleanText[i])
    const pattern = i < 6 ? getEANLeftPattern(digit) : getEANRightPattern(digit)
    encoded += pattern
  }
  
  encoded += '101'
  return encoded
}

function encodeUPC(text: string): string {
  const cleanText = text.replace(/[^0-9]/g, '').padStart(11, '0')
  let encoded = '101'
  
  for (let i = 0; i < cleanText.length; i++) {
    const digit = parseInt(cleanText[i])
    const pattern = i < 6 ? getEANLeftPattern(digit) : getEANRightPattern(digit)
    encoded += pattern
  }
  
  encoded += '101'
  return encoded
}

function encodeCODE39(text: string): string {
  const cleanText = text.toUpperCase()
  let encoded = '1000101110111010'
  
  for (let i = 0; i < cleanText.length; i++) {
    const char = cleanText[i]
    const pattern = getCODE39Pattern(char)
    encoded += pattern + '0'
  }
  
  encoded += '1000101110111010'
  return encoded
}

function encodeITF(text: string): string {
  const cleanText = text.replace(/[^0-9]/g, '')
  if (cleanText.length % 2 !== 0) {
    cleanText += '0'
  }
  
  let encoded = '1010'
  
  for (let i = 0; i < cleanText.length; i += 2) {
    const digit1 = parseInt(cleanText[i])
    const digit2 = parseInt(cleanText[i + 1])
    const pattern = getITFPattern(digit1, digit2)
    encoded += pattern
  }
  
  encoded += '11101'
  return encoded
}

function encodeMSI(text: string): string {
  const cleanText = text.replace(/[^0-9]/g, '')
  let encoded = '110'
  
  for (let i = 0; i < cleanText.length; i++) {
    const digit = parseInt(cleanText[i])
    const pattern = getMSIPattern(digit)
    encoded += pattern
  }
  
  encoded += '1001'
  return encoded
}

function getEANLeftPattern(digit: number): string {
  const patterns = [
    '0001101', '0011001', '0010011', '0111101', '0100011',
    '0110001', '0101111', '0111011', '0110111', '0001011'
  ]
  return patterns[digit] || patterns[0]
}

function getEANRightPattern(digit: number): string {
  const patterns = [
    '1110010', '1100110', '1101100', '1000010', '1011100',
    '1001110', '1010000', '1000100', '1001000', '1110100'
  ]
  return patterns[digit] || patterns[0]
}

function getCODE39Pattern(char: string): string {
  const patterns: Record<string, string> = {
    '0': '101001101101', '1': '110100101011', '2': '101100101011',
    '3': '110110010101', '4': '101001101011', '5': '110100110101',
    '6': '101100110101', '7': '101001011011', '8': '110100101101',
    '9': '101100101101', 'A': '110101001011', 'B': '101101001011',
    'C': '110110100101', 'D': '101011001011', 'E': '110101100101',
    'F': '101101100101', 'G': '101010011011', 'H': '110101001101',
    'I': '101101001101', 'J': '101011001101', 'K': '110101010011',
    'L': '101101010011', 'M': '110110101001', 'N': '101011010011',
    'O': '110101101001', 'P': '101101101001', 'Q': '101010110011',
    'R': '110101011001', 'S': '101101011001', 'T': '101011011001',
    'U': '110010101011', 'V': '100110101011', 'W': '110011010101',
    'X': '100101101011', 'Y': '110010110101', 'Z': '100110110101',
    '-': '100101011011', '.': '110010101101', ' ': '100110101101',
    '*': '100101101101'
  }
  return patterns[char] || patterns['0']
}

function getITFPattern(digit1: number, digit2: number): string {
  const patterns = [
    '00110', '10001', '01001', '11000', '00101',
    '10100', '01100', '00011', '10010', '01010'
  ]
  let encoded = ''
  const pattern1 = patterns[digit1] || patterns[0]
  const pattern2 = patterns[digit2] || patterns[0]
  
  for (let i = 0; i < 5; i++) {
    encoded += pattern1[i] + pattern2[i]
  }
  
  return encoded
}

function getMSIPattern(digit: number): string {
  const patterns = [
    '0101', '0011', '0110', '1001', '1100',
    '0111', '1011', '1101', '1110', '0001'
  ]
  return patterns[digit] || patterns[0]
}
