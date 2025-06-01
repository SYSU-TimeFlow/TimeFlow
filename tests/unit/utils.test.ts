import { describe, it, expect } from "vitest";
import * as utils from "../../src/utils/index";

describe("Utils Tests", () => {
  it("getStartOfWeek 应该返回当前周的开始日期（周日）", () => {
    const date = new Date("2023-10-11"); // 周三
    const startOfWeek = utils.getStartOfWeek(date);
    expect(startOfWeek.toDateString()).toBe(
      new Date("2023-10-08").toDateString()
    ); // 周日
  });

  it("getEndOfWeek 应该返回当前周的结束日期（周六）", () => {
    const date = new Date("2023-10-11"); // 周三
    const endOfWeek = utils.getEndOfWeek(date);
    expect(endOfWeek.toDateString()).toBe(
      new Date("2023-10-14").toDateString()
    ); // 周六
  });

  it("getMonthDays 应该返回月视图下的日期数组", () => {
    const testDate = new Date(2023, 5, 15); // 2023年6月15日

    const days = utils.getMonthDays(testDate, "0"); // 周日开始

    // 6月有30天，加上前后补全的天数
    expect(days.length).toBeGreaterThanOrEqual(35);
    expect(days.length).toBeLessThanOrEqual(42);

    // 检查当前月的天数
    const currentMonthDays = days.filter((d) => d.isCurrentMonth);
    expect(currentMonthDays.length).toBe(30);
  });

  it("getMonthDays 应该按照周起始日的设置", () => {
    const weekStart = "1"; // 周一开始

    const testDate = new Date(2023, 5, 15); // 2023年6月15日
    const days = utils.getMonthDays(testDate, weekStart);

    // 6月1日是周四，如果周一开始，前面应该有3天（周一至周三）
    const firstCurrentMonthDay = days.find((d) => d.isCurrentMonth);
    expect(firstCurrentMonthDay?.dayNumber).toBe(1);
    expect(new Date(firstCurrentMonthDay!.date).getDay()).toBe(4); // 周四

    // 前面的非当前月天数
    const prevMonthDays = days.slice(
      0,
      days.indexOf(firstCurrentMonthDay!)
    );
    expect(prevMonthDays.length).toBe(3);
  });

  it("getWeekDays 应该返回周视图下的日期数组", () => {
    const currentDate = new Date("2023-10-11");
    const weekDays = utils.getWeekDays(currentDate, 0); // 周起始日为周日
    expect(weekDays.length).toBe(7);
    expect(weekDays[0].dayName).toBe("星期日");
    expect(weekDays[3].dayName).toBe("星期三");
  });

  it("getWeekDayNames 应该返回正确的星期几显示顺序", () => {
    const weekDayNames = utils.getWeekDayNames(1); // 周起始日为周一
    expect(weekDayNames).toEqual([
      "星期一",
      "星期二",
      "星期三",
      "星期四",
      "星期五",
      "星期六",
      "星期日",
    ]);
  });

  it("getLunarDate 应该返回正确的农历日期", () => {
      // 2023-01-22 是春节（农历正月初一）
      const date1 = new Date(2023, 0, 22);
      const result1 = utils.getLunarDate(date1);
      expect(result1.day).toBe("初一");
      expect(result1.month).toBe("正月");

      // 2023-01-23 是农历正月初二
      const date2 = new Date(2023, 0, 23);
      const result2 = utils.getLunarDate(date2);
      expect(result2.day).toBe("初二");
      expect(result2.month).toBeUndefined();
  });

  it("getLunarYearDays 应该返回农历一年的总天数", () => {
    expect(utils.getLunarYearDays(2023)).toBe(384); // 2023年有闰二月，共384天
    expect(utils.getLunarYearDays(2022)).toBe(355);
  });

  it("getLeapMonth 应该返回闰月的月份", () => {
    expect(utils.getLeapMonth(2023)).toBe(2); // 2023年闰二月
    expect(utils.getLeapMonth(2022)).toBe(0); // 2022年无闰月
  });

  it("getLeapMonthDays 应该返回闰月的天数", () => {
    expect(utils.getLeapMonthDays(2023)).toBe(29); // 2023年闰二月29天
    expect(utils.getLeapMonthDays(2022)).toBe(0);
  });

  it("getLunarMonthDays 应该返回农历某月的总天数", () => {
    expect(utils.getLunarMonthDays(2023, 1)).toBe(29); // 2023年正月29天
    expect(utils.getLunarMonthDays(2023, 2)).toBe(30); // 2023年农历二月30天
    expect(utils.getLunarMonthDays(2023, 3)).toBe(29); // 2023年闰二月29天
  });

  it("getContrastColor 应该返回正确的对比色", () => {
    expect(utils.getContrastColor("#FFFFFF")).toBe("#000000");
    expect(utils.getContrastColor("#000000")).toBe("#ffffff");
  });

  it("calculateEventTop 应该返回正确的事件顶部位置", () => {
    const event = { eventType: "normal", start: "2023-10-11T10:00:00" };
    expect(utils.calculateEventTop(event)).toBeCloseTo(640); // 10小时 * 64px
  });

  it("calculateEventHeight 应该返回正确的事件高度", () => {
    const event = {
      eventType: "normal",
      start: "2023-10-11T10:00:00",
      end: "2023-10-11T12:00:00",
    };
    expect(utils.calculateEventHeight(event)).toBeCloseTo(128); // 2小时 * 64px
  });

  it("isSameDay 应该正确判断是否是同一天", () => {
    const date1 = new Date("2023-10-11");
    const date2 = new Date("2023-10-11");
    expect(utils.isSameDay(date1, date2)).toBe(true);
  });

  it("isToday 应该正确判断是否是今天", () => {
    const today = new Date();
    expect(utils.isToday(today)).toBe(true);
  });

  it("isWeekend 应该正确判断是否是周末", () => {
    const sunday = new Date("2023-10-08");
    const saturday = new Date("2023-10-14");
    expect(utils.isWeekend(sunday)).toBe(true);
    expect(utils.isWeekend(saturday)).toBe(true);
  });

  it("formatEventTime 应该正确格式化事件时间", () => {
    const event = {
      allDay: false,
      start: new Date("2023-10-11T10:00:00"),
      end: new Date("2023-10-11T12:00:00"),
    };
    expect(utils.formatEventTime(event, true)).toBe("10:00 - 12:00");
  });

  it("formatTime 应该正确格式化时间", () => {
    const date = new Date("2023-10-11T10:00:00");
    expect(utils.formatTime(date, true)).toBe("10:00");
    expect(utils.formatTime(date, false)).toBe("上午10:00");
  });

  it("formatHour 应该正确格式化小时", () => {
    expect(utils.formatHour(10, true)).toBe("10:00");
    expect(utils.formatHour(10, false)).toBe("10:00 AM");
  });

  it("formatDateForInput 应该正确格式化日期用于输入框", () => {
    const date = new Date("2023-10-11T10:00:00");
    expect(utils.formatDateForInput(date)).toBe("2023-10-11T10:00");
  });

  it("formatDateForDisplay 应该正确格式化日期用于显示", () => {
    const date = new Date("2023-10-11T10:00:00");
    expect(utils.formatDateForDisplay(date)).toBe("2023/10/11 10:00");
  });

  it("getEventGroups 应该正确分组重叠事件", () => {
    const events = [
      { start: "2023-10-11T10:00:00", end: "2023-10-11T12:00:00" },
      { start: "2023-10-11T11:00:00", end: "2023-10-11T13:00:00" },
      { start: "2023-10-11T14:00:00", end: "2023-10-11T15:00:00" },
    ];
    const groups = utils.getEventGroups(events);
    expect(groups.length).toBe(2); // 两组：重叠和非重叠
  });
});
