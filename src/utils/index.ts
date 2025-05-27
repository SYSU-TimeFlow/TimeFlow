/**
 * 获取一周的开始日期（周日）
 */
export function getStartOfWeek(date: Date): Date {
  const result = new Date(date);
  const day = result.getDay();
  result.setDate(result.getDate() - day);
  return result;
}

/**
 * 获取一周的结束日期（周六）
 */
export function getEndOfWeek(date: Date): Date {
  const result = new Date(date);
  const day = result.getDay();
  result.setDate(result.getDate() + (6 - day));
  return result;
}

/**
 * 格式化小时显示
 */
export function formatHour(hour: number): string {
  return new Intl.DateTimeFormat("zh-CN", {
    hour: "numeric",
    hour12: true,
  }).format(new Date(2025, 0, 1, hour));
}

/**
 * 根据背景色获取对比色（黑色或白色）
 */
export function getContrastColor(hexColor: string): string {
  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? "#000000" : "#ffffff";
}

/**
 * 计算事件在时间轴上的位置
 */
export function calculateEventTop(event: any): number {
  // 对于both类型事件（即待办事项），使用截止时间减去1小时作为展示位置
  if (event.eventType === 'both' && new Date(event.start).getFullYear() <= 1970) {
    const end = new Date(event.end);
    // 确保待办事项至少显示在截止时间前1小时的位置
    const endHour = end.getHours();
    const endMinute = end.getMinutes();
    // 如果结束时间在0点之后，则显示在前一小时
    const displayHour = endHour > 0 ? endHour - 1 : 0;
    return ((displayHour * 60 + endMinute) / 60) * 64;
  }
  
  // 对于普通事件，使用原来的计算方式
  const start = new Date(event.start);
  return ((start.getHours() * 60 + start.getMinutes()) / 60) * 64;
}

/**
 * 计算事件的高度
 */
export function calculateEventHeight(event: any): number {
  // 对于both类型事件（即待办事项），固定高度为1小时
  if (event.eventType === 'both' && new Date(event.start).getFullYear() <= 1970) {
    return 64; // 1小时的高度
  }
  
  // 对于普通事件，使用原来的计算方式
  const start = new Date(event.start);
  const end = new Date(event.end);
  const durationHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
  return Math.max(durationHours * 64, 24);
}

/**
 * 防抖函数
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: any;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

/**
 * 节流函数
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), wait);
    }
  };
}

/**
 * 深拷贝函数
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== "object") {
    return obj;
  }
  
  if (obj instanceof Date) {
    return new Date(obj.getTime()) as T;
  }
  
  if (obj instanceof Array) {
    return obj.map(item => deepClone(item)) as T;
  }
  
  if (typeof obj === "object") {
    const clonedObj = {} as T;
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key]);
      }
    }
    return clonedObj;
  }
  
  return obj;
}

/**
 * 格式化日期为字符串
 */
export function formatDate(date: Date, format: string = "YYYY-MM-DD"): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");

  return format
    .replace("YYYY", String(year))
    .replace("MM", month)
    .replace("DD", day)
    .replace("HH", hours)
    .replace("mm", minutes)
    .replace("ss", seconds);
}

/**
 * 检查两个日期是否是同一天
 */
export function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

/**
 * 检查日期是否是今天
 */
export function isToday(date: Date): boolean {
  return isSameDay(date, new Date());
}

/**
 * 检查日期是否是周末
 */
export function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}