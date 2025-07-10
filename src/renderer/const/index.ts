// 事件类型枚举
export enum EventType {
  CALENDAR = "calendar",
  TODO = "todo",
  BOTH = "both", // 同时作为日历事件和待办事项
}

// 统一的事件类
export class Event {
  constructor(
    public id: number,
    public title: string,
    public start: Date,
    public end: Date,
    public description: string = "",
    public categoryId: number = 5,
    public categoryColor: string = "#43aa8b",
    public allDay: boolean = false,
    public eventType: EventType = EventType.CALENDAR,
    public completed: boolean = false
  ) {}
}

// 过滤器类型保持不变
export type FilterType = "today" | "all" | "completed" | "active";

// 新增：分类接口定义
export interface Category {
  id: number;
  name: string;
  color: string;
  active: boolean;
}

// 预设颜色选项保持不变
export const colorOptions = [
  "#e63946", // 红色
  "#f8961e", // 橙色
  "#fcbf49", // 黄色
  "#2a9d8f", // 青绿色
  "#43aa8b", // 绿色
  "#4cc9f0", // 青色
  "#3a86ff", // 蓝色
  "#7209b7", // 紫色
  "#f72585", // 粉色
  "#495057", // 深灰色
];

// 添加接口定义
export interface Settings {
  themeMode: string;
  fontSize: string;
  iconStyle: string;
  notifications: boolean;
  hour24: boolean;
  showLunar: boolean;
  weekStart: string;
  language: string;
}

// 添加日期相关的接口定义
export interface CalendarDay {
  date: Date;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isWeekend: boolean;
}

export interface WeekDay {
  date: Date;
  dayNumber: number;
  dayName: string;
  isToday: boolean;
}

export interface WeekViewDay {
  date: Date;
  dayName: string;
  dayNumber: number;
  isToday: boolean;
  events: any[];
}

// 定义日历视图选项
export const calendarViews = [
  { id: "month", label: "Month", icon: "fa-calendar-alt" },
  { id: "week", label: "Week", icon: "fa-calendar-week" },
  { id: "day", label: "Day", icon: "fa-calendar-day" },
  { id: "todo", label: "ToDo", icon: "fa-list-check" },
];

// 农历数据表
export const lunarInfo = [
  0x04bd8, 0x04ae0, 0x0a570, 0x054d5, 0x0d260, 0x0d950, 0x16554, 0x056a0,
  0x09ad0, 0x055d2, 0x04ae0, 0x0a5b6, 0x0a4d0, 0x0d250, 0x1d255, 0x0b540,
  0x0d6a0, 0x0ada2, 0x095b0, 0x14977, 0x04970, 0x0a4b0, 0x0b4b5, 0x06a50,
  0x06d40, 0x1ab54, 0x02b60, 0x09570, 0x052f2, 0x04970, 0x06566, 0x0d4a0,
  0x0ea50, 0x06e95, 0x05ad0, 0x02b60, 0x186e3, 0x092e0, 0x1c8d7, 0x0c950,
  0x0d4a0, 0x1d8a6, 0x0b550, 0x056a0, 0x1a5b4, 0x025d0, 0x092d0, 0x0d2b2,
  0x0a950, 0x0b557, 0x06ca0, 0x0b550, 0x15355, 0x04da0, 0x0a5d0, 0x14573,
  0x052d0, 0x0a9a8, 0x0e950, 0x06aa0, 0x0aea6, 0x0ab50, 0x04b60, 0x0aae4,
  0x0a570, 0x05260, 0x0f263, 0x0d950, 0x05b57, 0x056a0, 0x096d0, 0x04dd5,
  0x04ad0, 0x0a4d0, 0x0d4d4, 0x0d250, 0x0d558, 0x0b540, 0x0b5a0, 0x195a6,
  0x095b0, 0x049b0, 0x0a974, 0x0a4b0, 0x0b27a, 0x06a50, 0x06d40, 0x0af46,
  0x0ab60, 0x09570, 0x04af5, 0x04970, 0x064b0, 0x074a3, 0x0ea50, 0x06b58,
  0x055c0, 0x0ab60, 0x096d5, 0x092e0, 0x0c960, 0x0d954, 0x0d4a0, 0x0da50,
  0x07552, 0x056a0, 0x0abb7, 0x025d0, 0x092d0, 0x0cab5, 0x0a950, 0x0b4a0,
  0x0baa4, 0x0ad50, 0x055d9, 0x04ba0, 0x0a5b0, 0x15176, 0x052b0, 0x0a930,
  0x07954, 0x06aa0, 0x0ad50, 0x05b52, 0x04b60, 0x0a6e6, 0x0a4e0, 0x0d260,
  0x0ea65, 0x0d530, 0x05aa0, 0x076a3, 0x096d0, 0x04bd7, 0x04ad0, 0x0a4d0,
  0x1d0b6, 0x0d250, 0x0d520, 0x0dd45, 0x0b5a0, 0x056d0, 0x055b2, 0x049b0,
  0x0a577, 0x0a4b0, 0x0aa50, 0x1b255, 0x06d20, 0x0ada0,
];

// 农历月份名称
export const monthNames = [
  "正月",
  "二月",
  "三月",
  "四月",
  "五月",
  "六月",
  "七月",
  "八月",
  "九月",
  "十月",
  "冬月",
  "腊月",
];

// 农历日期名称
export const dayNames = [
  "初一",
  "初二",
  "初三",
  "初四",
  "初五",
  "初六",
  "初七",
  "初八",
  "初九",
  "初十",
  "十一",
  "十二",
  "十三",
  "十四",
  "十五",
  "十六",
  "十七",
  "十八",
  "十九",
  "二十",
  "廿一",
  "廿二",
  "廿三",
  "廿四",
  "廿五",
  "廿六",
  "廿七",
  "廿八",
  "廿九",
  "三十",
];

export const weekDays = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
