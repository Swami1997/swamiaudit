export function debounce<T extends (...args: any[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;

  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

export function classNames(...classes: (string | boolean | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function generatePointId(): string {
  const timestamp = Date.now().toString();
  const randomNum = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let text = '';
  for (let i = 0; i < 4; i++) {
    text += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return `${randomNum}${text}`;
}