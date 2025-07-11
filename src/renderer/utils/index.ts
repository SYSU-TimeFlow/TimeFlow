import {
  lunarInfo,
  monthNames,
  dayNames,
  CalendarDay,
  WeekDay,
  weekDays,
  EventType,
} from "./../const";

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
 * 获取月视图的日期数组
 * @param currentDate 当前日期
 * @returns 月视图的日期数组
 */
export function getMonthDays(currentDate: Date, weekStart): CalendarDay[] {
  const startDay = parseInt(weekStart);

  // 获取当月第一天
  const firstDay = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    1
  );
  // 获取当月最后一天
  const lastDay = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
    0
  );

  // 计算当月第一天是星期几（0-6）
  let firstDayOfWeek = firstDay.getDay();
  // 根据周起始日调整
  firstDayOfWeek = (firstDayOfWeek - startDay + 7) % 7;

  // 计算需要显示的上个月的天数
  const prevMonthDays = firstDayOfWeek;

  // 计算当月总天数
  const currentMonthDays = lastDay.getDate();

  // 计算需要显示的总天数（确保是7的倍数）
  const totalDays = Math.ceil((prevMonthDays + currentMonthDays) / 7) * 7;

  // 计算需要显示的下个月的天数
  const nextMonthDays = totalDays - prevMonthDays - currentMonthDays;

  const days: CalendarDay[] = [];

  // 添加上个月的日期
  const prevMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    0
  );
  for (let i = prevMonthDays - 1; i >= 0; i--) {
    const date = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() - 1,
      prevMonth.getDate() - i
    );
    days.push({
      date,
      dayNumber: date.getDate(),
      isCurrentMonth: false,
      isToday: false,
      isWeekend: date.getDay() === 0 || date.getDay() === 6,
    });
  }

  // 添加当月的日期
  for (let i = 1; i <= currentMonthDays; i++) {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), i);
    days.push({
      date,
      dayNumber: i,
      isCurrentMonth: true,
      isToday: date.toDateString() === new Date().toDateString(),
      isWeekend: date.getDay() === 0 || date.getDay() === 6,
    });
  }

  // 添加下个月的日期
  for (let i = 1; i <= nextMonthDays; i++) {
    const date = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + 1,
      i
    );
    days.push({
      date,
      dayNumber: i,
      isCurrentMonth: false,
      isToday: false,
      isWeekend: date.getDay() === 0 || date.getDay() === 6,
    });
  }

  return days;
}

/**
 * 获取周视图的日期数组
 * @param currentDate 当前日期
 * @returns 周视图的日期数组
 */
export function getWeekDays(currentDate: Date, weekStart): WeekDay[] {
  const startDay = parseInt(weekStart);

  // 获取当前日期是星期几（0-6）
  let currentDayOfWeek = currentDate.getDay();
  // 根据周起始日调整
  currentDayOfWeek = (currentDayOfWeek - startDay + 7) % 7;

  // 计算本周的第一天
  const firstDayOfWeek = new Date(currentDate);
  firstDayOfWeek.setDate(currentDate.getDate() - currentDayOfWeek);

  // 生成一周的日期
  const weekDays: WeekDay[] = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(firstDayOfWeek);
    date.setDate(firstDayOfWeek.getDate() + i);

    weekDays.push({
      date,
      dayNumber: date.getDate(),
      dayName: [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ][date.getDay()],
      isToday: date.toDateString() === new Date().toDateString(),
    });
  }

  return weekDays;
}

/**
 * 获取星期几显示顺序
 * @returns 星期几显示顺序数组
 */
export function getWeekDayNames(weekStart) {
  const startDay = parseInt(weekStart);
  return [...weekDays.slice(startDay), ...weekDays.slice(0, startDay)];
}

/**
 * 获取农历日期
 * @param date 公历日期
 * @returns 农历日期对象，包含日期和月份信息
 */
export function getLunarDate(date: Date): { day: string; month?: string } {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();

  // 计算与1900年1月31日相差的天数
  let offset =
    (Date.UTC(year, month - 1, day) - Date.UTC(1900, 0, 31)) / 86400000;

  // 用offset减去每农历年的天数，计算当前农历年份
  let lunarYear = 1900;
  let temp = 0;
  for (lunarYear = 1900; lunarYear < 2100 && offset > 0; lunarYear++) {
    temp = getLunarYearDays(lunarYear);
    offset -= temp;
  }
  if (offset < 0) {
    offset += temp;
    lunarYear--;
  }

  // 计算农历月份
  let lunarMonth = 1;
  let isLeap = false;
  let leapMonth = getLeapMonth(lunarYear);
  let monthDays = 0;

  for (lunarMonth = 1; lunarMonth < 13 && offset > 0; lunarMonth++) {
    // 闰月
    if (leapMonth > 0 && lunarMonth === leapMonth + 1 && !isLeap) {
      --lunarMonth;
      isLeap = true;
      monthDays = getLeapMonthDays(lunarYear);
    } else {
      monthDays = getLunarMonthDays(lunarYear, lunarMonth);
    }

    if (isLeap && lunarMonth === leapMonth + 1) {
      isLeap = false;
    }
    offset -= monthDays;
  }

  if (offset === 0 && leapMonth > 0 && lunarMonth === leapMonth + 1) {
    if (isLeap) {
      isLeap = false;
    } else {
      isLeap = true;
      --lunarMonth;
    }
  }
  if (offset < 0) {
    offset += monthDays;
    --lunarMonth;
  }

  // 计算农历日期
  let lunarDay = offset + 1;

  const result: { day: string; month?: string } = {
    day: dayNames[lunarDay - 1],
  };

  // 如果是初一，添加月份信息
  if (lunarDay === 1) {
    result.month = monthNames[lunarMonth - 1];
  }

  return result;
}

/**
 * 获取农历年的总天数
 */
export function getLunarYearDays(year: number): number {
  let total = 0;
  for (let i = 0x8000; i > 0x8; i >>= 1) {
    total += lunarInfo[year - 1900] & i ? 30 : 29;
  }
  return total + getLeapMonthDays(year);
}

/**
 * 获取闰月的天数
 */
export function getLeapMonthDays(year: number): number {
  if (getLeapMonth(year)) {
    return lunarInfo[year - 1900] & 0x10000 ? 30 : 29;
  }
  return 0;
}

/**
 * 获取闰月月份
 */
export function getLeapMonth(year: number): number {
  return lunarInfo[year - 1900] & 0xf;
}

/**
 * 获取农历某月的总天数
 */
export function getLunarMonthDays(year: number, month: number): number {
  return lunarInfo[year - 1900] & (0x10000 >> month) ? 30 : 29;
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
 * @param event 事件对象
 * @param currentDate 当前视图的日期，可选，表示使用事件自身的日期
 */
export function calculateEventTop(event: any, currentDate?: Date): number {
  // 对于both类型事件（即待办事项），使用截止时间减去1小时作为展示位置
  if (
    event.eventType === "both" &&
    new Date(event.start).getFullYear() <= 1970
  ) {
    const end = new Date(event.end);
    // 确保待办事项至少显示在截止时间前1小时的位置
    const endHour = end.getHours();
    const endMinute = end.getMinutes();
    // 如果结束时间在0点之后，则显示在前一小时
    const displayHour = endHour > 0 ? endHour - 1 : 0;
    return ((displayHour * 60 + endMinute) / 60) * 64;
  }

  // 处理跨天事件的不同情况
  const start = new Date(event.start);
  const end = new Date(event.end);
  
  // 如果没有提供当前日期，则默认使用事件的开始日期
  const viewDate = currentDate || new Date(start);
  const viewDateStart = new Date(viewDate.getFullYear(), viewDate.getMonth(), viewDate.getDate(), 0, 0, 0);
  const viewDateEnd = new Date(viewDate.getFullYear(), viewDate.getMonth(), viewDate.getDate(), 23, 59, 59);
  
  // 情况1：开始时间在当天，结束时间不在当天 - 使用开始时间的位置
  if (start >= viewDateStart && start <= viewDateEnd && end > viewDateEnd) {
    return ((start.getHours() * 60 + start.getMinutes()) / 60) * 64;
  }
  
  // 情况2：开始时间和结束时间都不在当天 - 从0点开始渲染
  else if (start < viewDateStart && end > viewDateEnd) {
    return 0; // 从当天开始（0点）
  }
  
  // 情况3：开始时间不在当天（在当天之前），但结束时间在当天 - 从0点开始渲染
  else if (start < viewDateStart && end >= viewDateStart && end <= viewDateEnd) {
    return 0; // 从当天开始（0点）
  }
  
  // 情况4：事件完全在当天内 - 使用开始时间的位置
  else {
    return ((start.getHours() * 60 + start.getMinutes()) / 60) * 64;
  }
}

/**
 * 计算事件的高度
 * @param event 事件对象
 * @param currentDate 当前视图的日期，可选，表示使用事件自身的日期
 */
export function calculateEventHeight(event: any, currentDate?: Date): number {
  // 对于both类型事件（即待办事项），固定高度为1小时
  if (
    event.eventType === "both" &&
    new Date(event.start).getFullYear() <= 1970
  ) {
    return 64; // 1小时的高度
  }

  // 对于普通事件，根据是否跨天处理
  const start = new Date(event.start);
  const end = new Date(event.end);
  
  // 如果没有提供当前日期，则默认使用事件的开始日期
  const viewDate = currentDate || new Date(start);
  const viewDateStart = new Date(viewDate.getFullYear(), viewDate.getMonth(), viewDate.getDate(), 0, 0, 0);
  const viewDateEnd = new Date(viewDate.getFullYear(), viewDate.getMonth(), viewDate.getDate(), 23, 59, 59);
  
  // 情况1：开始时间在当天，结束时间不在当天
  if (start >= viewDateStart && start <= viewDateEnd && end > viewDateEnd) {
    // 从开始时间到当天结束
    const durationHours = (viewDateEnd.getTime() - start.getTime()) / (1000 * 60 * 60);
    return Math.max(durationHours * 64, 24);
  }
  
  // 情况2：开始时间和结束时间都不在当天（开始时间在当天之前，结束时间在当天之后）
  else if (start < viewDateStart && end > viewDateEnd) {
    // 渲染整天
    return 24 * 64; // 24小时 * 64px/小时 = 整天高度
  }
  
  // 情况3：开始时间不在当天（在当天之前），但结束时间在当天
  else if (start < viewDateStart && end >= viewDateStart && end <= viewDateEnd) {
    // 从当天开始到结束时间
    const durationHours = (end.getTime() - viewDateStart.getTime()) / (1000 * 60 * 60);
    return Math.max(durationHours * 64, 24);
  }
  
  // 情况4：事件完全在当天内
  else {
    const durationHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    return Math.max(durationHours * 64, 24);
  }
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

/**
 * 格式化事件时间显示
 */
export function formatEventTime(event: any, hour24: boolean): string {
  if (event.allDay) {
    return "全天";
  }
  return `${formatTime(event.start, hour24)} - ${formatTime(
    event.end,
    hour24
  )}`;
}

/**
 * 格式化时间为12小时制或24小时制
 */
export function formatTime(date: Date, hour24: boolean): string {
  if (hour24) {
    // 24小时制
    return date.toLocaleTimeString("zh-CN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  } else {
    // 12小时制
    return date.toLocaleTimeString("zh-CN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  }
}

/**
 * 格式化小时为12小时制或24小时制
 * @param hour 小时数（0-23）
 * @returns 格式化后的小时字符串
 */
export function formatHour(hour: number, hour24: boolean): string {
  if (hour24) {
    // 24小时制
    return `${hour.toString().padStart(2, "0")}:00`;
  } else {
    // 12小时制
    const period = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 || 12;
    return `${hour12}:00 ${period}`;
  }
}

/**
 * 将日期格式化为 YYYY-MM-DDThh:mm 格式，用于输入框
 */
export function formatDateForInput(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

// 将日期格式化为 YYYY/MM/DD hh:mm 格式，精确到分钟
export function formatDateForDisplay(date: Date): string {
  const dateStr = date.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const timeStr = date.toLocaleTimeString("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  return dateStr + " " + timeStr;
}

export function getEventGroups(events: any[]): any[][] {
  const n = events.length;
  const parent = Array(n)
    .fill(0)
    .map((_, i) => i);

  function find(x: number): number {
    if (parent[x] !== x) parent[x] = find(parent[x]);
    return parent[x];
  }
  function union(x: number, y: number) {
    parent[find(x)] = find(y);
  }

  // 判断是否重叠
  function isOverlap(a: any, b: any) {
    const aStart = new Date(a.start).getTime();
    const aEnd = new Date(a.end).getTime();
    const bStart = new Date(b.start).getTime();
    const bEnd = new Date(b.end).getTime();
    return !(aEnd <= bStart || aStart >= bEnd);
  }

  // 两两合并重叠的事件
  for (let i = 0; i < n; ++i) {
    for (let j = i + 1; j < n; ++j) {
      if (isOverlap(events[i], events[j])) {
        union(i, j);
      }
    }
  }

  // 分组
  const groupMap: Record<number, any[]> = {};
  for (let i = 0; i < n; ++i) {
    const root = find(i);
    if (!groupMap[root]) groupMap[root] = [];
    groupMap[root].push(events[i]);
  }
  return Object.values(groupMap);
}


/**
 * 获取跨天事件在月视图中的显示标签
 * @param event 事件对象
 * @param dayDate 当前日期格子的日期
 * @param hour24 是否24小时制
 * @returns 根据事件在当天的状态返回合适的标签
 */
export function getCrossDayLabel(event: any, dayDate: any, hour24: boolean): string {
  const start = new Date(event.start);
  const end = new Date(event.end);
  const currentDay = new Date(dayDate);
  
  // 设置时间为当天的开始和结束
  const dayStart = new Date(currentDay);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(currentDay);
  dayEnd.setHours(23, 59, 59, 999);
  
  // 情况1: 当前日期是事件的开始日期
  if (isSameDay(start, currentDay)) {
    return `Start ${formatTime(start, hour24)}`;
  }
  
  // 情况2: 当前日期是事件的结束日期
  else if (isSameDay(end, currentDay)) {
    return `End ${formatTime(end, hour24)}`;
  }
  
  // 情况3: 当前日期是事件跨越的中间日期
  else {
    return "Cross Day";
  }
}
