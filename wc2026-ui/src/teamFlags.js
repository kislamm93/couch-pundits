export const FLAG_MAP = {
  'Mexico': '🇲🇽', 'USA': '🇺🇸', 'Canada': '🇨🇦',
  'Brazil': '🇧🇷', 'Argentina': '🇦🇷', 'Colombia': '🇨🇴', 'Ecuador': '🇪🇨',
  'Uruguay': '🇺🇾', 'Chile': '🇨🇱', 'Paraguay': '🇵🇾', 'Peru': '🇵🇪',
  'Bolivia': '🇧🇴', 'Venezuela': '🇻🇪',
  'Germany': '🇩🇪', 'France': '🇫🇷', 'Spain': '🇪🇸', 'England': '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
  'Portugal': '🇵🇹', 'Netherlands': '🇳🇱', 'Belgium': '🇧🇪', 'Italy': '🇮🇹',
  'Croatia': '🇭🇷', 'Switzerland': '🇨🇭', 'Austria': '🇦🇹', 'Denmark': '🇩🇰',
  'Sweden': '🇸🇪', 'Norway': '🇳🇴', 'Poland': '🇵🇱',
  'Czech Republic': '🇨🇿', 'Bosnia & Herzegovina': '🇧🇦',
  'Serbia': '🇷🇸', 'Hungary': '🇭🇺', 'Romania': '🇷🇴', 'Ukraine': '🇺🇦',
  'Turkey': '🇹🇷', 'Scotland': '🏴󠁧󠁢󠁳󠁣󠁴󠁿', 'Wales': '🏴󠁧󠁢󠁷󠁬󠁳󠁿', 'Slovakia': '🇸🇰',
  'Slovenia': '🇸🇮', 'Albania': '🇦🇱', 'Georgia': '🇬🇪',
  'Morocco': '🇲🇦', 'Senegal': '🇸🇳', 'Nigeria': '🇳🇬', 'Egypt': '🇪🇬',
  'South Africa': '🇿🇦', 'Cameroon': '🇨🇲', 'Ghana': '🇬🇭', 'Tunisia': '🇹🇳',
  'Algeria': '🇩🇿', 'Mali': '🇲🇱', 'Ivory Coast': '🇨🇮',
  'Cape Verde': '🇨🇻', 'DR Congo': '🇨🇩', 'Haiti': '🇭🇹',
  'Japan': '🇯🇵', 'South Korea': '🇰🇷', 'Australia': '🇦🇺', 'Iran': '🇮🇷',
  'Saudi Arabia': '🇸🇦', 'Qatar': '🇶🇦', 'Iraq': '🇮🇶', 'Uzbekistan': '🇺🇿',
  'China': '🇨🇳', 'Indonesia': '🇮🇩', 'Jordan': '🇯🇴', 'Bahrain': '🇧🇭',
  'New Zealand': '🇳🇿', 'Curaçao': '🇨🇼',
}

export function teamFlag(name) {
  return FLAG_MAP[name] || '⚽'
}
