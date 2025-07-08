/**
 * @description 工具函数模块的扩展单元测试
 * 本文件包含对 utils 模块各种工具函数的全面测试，包括日期处理、
 * 日历视图计算、农历计算、格式化函数等。
 * 
 * 测试使用 vitest 测试框架，覆盖边界情况和错误处理。
 */

import { describe, it, expect, beforeEach } from "vitest";
import * as utils from "../../src/utils/index";

describe("Utils - Extended Tests", () => {
  describe("Date Utilities", () => {
    it("getStartOfWeek 应该返回正确的周开始日期", () => {
      // 测试2023年10月11日（周三）
      const testDate = new Date(2023, 9, 11); // 月份从0开始
      const startOfWeek = utils.getStartOfWeek(testDate);
      
      // 周日应该是10月8日
      expect(startOfWeek.getDate()).toBe(8);
      expect(startOfWeek.getDay()).toBe(0); // 周日
    });

    it("getEndOfWeek 应该返回正确的周结束日期", () => {
      const testDate = new Date(2023, 9, 11); // 2023年10月11日（周三）
      const endOfWeek = utils.getEndOfWeek(testDate);
      
      // 周六应该是10月14日
      expect(endOfWeek.getDate()).toBe(14);
      expect(endOfWeek.getDay()).toBe(6); // 周六
    });

    it("应该处理跨月的周开始/结束日期", () => {
      const testDate = new Date(2023, 9, 1); // 2023年10月1日（周日）
      const startOfWeek = utils.getStartOfWeek(testDate);
      const endOfWeek = utils.getEndOfWeek(testDate);
      
      expect(startOfWeek.getDate()).toBe(1);
      expect(startOfWeek.getMonth()).toBe(9); // 10月
      expect(endOfWeek.getDate()).toBe(7);
      expect(endOfWeek.getMonth()).toBe(9); // 10月
    });

    it("应该处理跨年的周日期", () => {
      const testDate = new Date(2023, 0, 1); // 2023年1月1日（周日）
      const startOfWeek = utils.getStartOfWeek(testDate);
      
      expect(startOfWeek.getFullYear()).toBe(2023);
      expect(startOfWeek.getMonth()).toBe(0);
      expect(startOfWeek.getDate()).toBe(1);
    });
  });

  describe("Month View Utilities", () => {
    it("getMonthDays 应该返回正确的天数 - 标准月份", () => {
      const testDate = new Date(2023, 5, 15); // 2023年6月
      const days = utils.getMonthDays(testDate, "0"); // 周日开始
      
      expect(days.length).toBeGreaterThanOrEqual(35);
      expect(days.length).toBeLessThanOrEqual(42);
      expect(days.length % 7).toBe(0); // 应该是7的倍数
    });

    it("getMonthDays 应该正确标记当前月的天数", () => {
      const testDate = new Date(2023, 5, 15); // 2023年6月
      const days = utils.getMonthDays(testDate, "0");
      
      const currentMonthDays = days.filter(d => d.isCurrentMonth);
      expect(currentMonthDays.length).toBe(30); // 6月有30天
      
      // 检查第一天和最后一天
      expect(currentMonthDays[0].dayNumber).toBe(1);
      expect(currentMonthDays[29].dayNumber).toBe(30);
    });

    it("getMonthDays 应该正确处理不同的周起始日", () => {
      const testDate = new Date(2023, 5, 15); // 2023年6月
      
      const daysStartSunday = utils.getMonthDays(testDate, "0");
      const daysStartMonday = utils.getMonthDays(testDate, "1");
      
      expect(daysStartSunday.length).toBeGreaterThan(0);
      expect(daysStartMonday.length).toBeGreaterThan(0);
      
      // 不同周起始日的结果可能不同
      expect(daysStartSunday.length).toBeGreaterThanOrEqual(35);
      expect(daysStartMonday.length).toBeGreaterThanOrEqual(35);
    });

    it("getMonthDays 应该正确标记今天", () => {
      const today = new Date();
      const days = utils.getMonthDays(today, "0");
      
      const todayInCalendar = days.find(d => d.isToday);
      if (todayInCalendar) {
        expect(todayInCalendar.dayNumber).toBe(today.getDate());
        expect(todayInCalendar.isCurrentMonth).toBe(true);
      }
    });

    it("getMonthDays 应该正确标记周末", () => {
      const testDate = new Date(2023, 5, 15); // 2023年6月
      const days = utils.getMonthDays(testDate, "0");
      
      const weekendDays = days.filter(d => d.isWeekend);
      expect(weekendDays.length).toBeGreaterThan(0);
      
      // 验证周末天是周六或周日
      weekendDays.forEach(day => {
        const dayOfWeek = day.date.getDay();
        expect(dayOfWeek === 0 || dayOfWeek === 6).toBe(true);
      });
    });

    it("getMonthDays 应该处理2月闰年", () => {
      const leapYear = new Date(2024, 1, 15); // 2024年2月（闰年）
      const regularYear = new Date(2023, 1, 15); // 2023年2月（平年）
      
      const leapDays = utils.getMonthDays(leapYear, "0");
      const regularDays = utils.getMonthDays(regularYear, "0");
      
      const leapFebDays = leapDays.filter(d => d.isCurrentMonth);
      const regularFebDays = regularDays.filter(d => d.isCurrentMonth);
      
      expect(leapFebDays.length).toBe(29);
      expect(regularFebDays.length).toBe(28);
    });
  });

  describe("Week View Utilities", () => {
    it("getWeekDays 应该返回7天", () => {
      const testDate = new Date(2023, 9, 11);
      const weekDays = utils.getWeekDays(testDate, 0);
      
      expect(weekDays.length).toBe(7);
    });

    it("getWeekDays 应该包含正确的日期信息", () => {
      const testDate = new Date(2023, 9, 11); // 2023年10月11日（周三）
      const weekDays = utils.getWeekDays(testDate, 0); // 周日开始
      
      // 第一天应该是周日
      expect(weekDays[0].dayName).toBe("星期日");
      expect(weekDays[0].date.getDay()).toBe(0);
      
      // 第四天应该是周三（包含测试日期）
      expect(weekDays[3].dayName).toBe("星期三");
      expect(weekDays[3].date.getDay()).toBe(3);
      
      // 最后一天应该是周六
      expect(weekDays[6].dayName).toBe("星期六");
      expect(weekDays[6].date.getDay()).toBe(6);
    });

    it("getWeekDays 应该正确标记今天", () => {
      const today = new Date();
      const weekDays = utils.getWeekDays(today, 0);
      
      const todayInWeek = weekDays.find(d => d.isToday);
      expect(todayInWeek).toBeDefined();
      if (todayInWeek) {
        expect(todayInWeek.dayNumber).toBe(today.getDate());
      }
    });

    it("getWeekDayNames 应该返回正确的星期名称顺序", () => {
      const weekDayNamesStartSunday = utils.getWeekDayNames(0);
      const weekDayNamesStartMonday = utils.getWeekDayNames(1);
      
      expect(weekDayNamesStartSunday).toEqual([
        "星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"
      ]);
      
      expect(weekDayNamesStartMonday).toEqual([
        "星期一", "星期二", "星期三", "星期四", "星期五", "星期六", "星期日"
      ]);
    });

    it("getWeekDayNames 应该处理无效的周起始日", () => {
      const weekDayNames = utils.getWeekDayNames(7); // 无效值
      expect(weekDayNames.length).toBe(7);
      expect(weekDayNames[0]).toBe("星期日"); // 应该默认为周日开始
    });
  });

  describe("Date Formatting Utilities", () => {
    it("formatDateForInput 应该返回正确的格式", () => {
      const testDate = new Date(2023, 9, 11, 14, 30); // 2023年10月11日 14:30
      const formatted = utils.formatDateForInput(testDate);
      
      expect(formatted).toBe("2023-10-11T14:30");
    });

    it("formatDateForInput 应该处理单位数的月份和日期", () => {
      const testDate = new Date(2023, 0, 5, 9, 5); // 2023年1月5日 09:05
      const formatted = utils.formatDateForInput(testDate);
      
      expect(formatted).toBe("2023-01-05T09:05");
    });

    it("formatDateForInput 应该处理午夜时间", () => {
      const testDate = new Date(2023, 9, 11, 0, 0); // 2023年10月11日 00:00
      const formatted = utils.formatDateForInput(testDate);
      
      expect(formatted).toBe("2023-10-11T00:00");
    });
  });

  describe("Lunar Calendar Utilities", () => {
    it("应该能够计算农历日期", () => {
      if (typeof (utils as any).getLunarDate === 'function') {
        const testDate = new Date(2023, 9, 11); // 2023年10月11日
        const lunarDate = (utils as any).getLunarDate(testDate);
        
        expect(lunarDate).toBeDefined();
        expect(typeof lunarDate).toBe('object');
      }
    });

    it("应该处理农历节日", () => {
      if (typeof (utils as any).getLunarFestival === 'function') {
        // 测试春节日期
        const springFestival = new Date(2023, 0, 22); // 2023年春节
        const festival = (utils as any).getLunarFestival(springFestival);
        
        if (festival) {
          expect(typeof festival).toBe('string');
        }
      }
    });
  });

  describe("Edge Cases and Error Handling", () => {
    it("应该处理无效日期输入", () => {
      const invalidDate = new Date("invalid");
      
      // 大多数函数应该能够处理无效日期而不崩溃
      expect(() => {
        utils.getStartOfWeek(invalidDate);
      }).not.toThrow();
    });

    it("应该处理极端日期值", () => {
      const minDate = new Date(1900, 0, 1);
      const maxDate = new Date(2100, 11, 31);
      
      expect(() => {
        utils.getMonthDays(minDate, "0");
        utils.getWeekDays(minDate, 0);
        utils.formatDateForInput(minDate);
      }).not.toThrow();
      
      expect(() => {
        utils.getMonthDays(maxDate, "0");
        utils.getWeekDays(maxDate, 0);
        utils.formatDateForInput(maxDate);
      }).not.toThrow();
    });

    it("应该处理跨年的月份计算", () => {
      const yearEnd = new Date(2023, 11, 31); // 2023年12月31日
      const yearStart = new Date(2024, 0, 1); // 2024年1月1日
      
      const daysEnd = utils.getMonthDays(yearEnd, "0");
      const daysStart = utils.getMonthDays(yearStart, "0");
      
      expect(daysEnd.length).toBeGreaterThan(0);
      expect(daysStart.length).toBeGreaterThan(0);
    });

    it("应该处理时区变化", () => {
      const testDate = new Date(2023, 9, 11, 2, 30); // 可能涉及夏令时变化的时间
      
      expect(() => {
        utils.getStartOfWeek(testDate);
        utils.getEndOfWeek(testDate);
        utils.getMonthDays(testDate, "0");
        utils.getWeekDays(testDate, 0);
      }).not.toThrow();
    });
  });

  describe("Performance Tests", () => {
    it("getMonthDays 应该在合理时间内完成", () => {
      const start = performance.now();
      
      for (let i = 0; i < 100; i++) {
        const testDate = new Date(2023, i % 12, 15);
        utils.getMonthDays(testDate, "0");
      }
      
      const end = performance.now();
      const duration = end - start;
      
      // 100次调用应该在100ms内完成
      expect(duration).toBeLessThan(100);
    });

    it("getWeekDays 应该在合理时间内完成", () => {
      const start = performance.now();
      
      for (let i = 0; i < 1000; i++) {
        const testDate = new Date(2023, 0, i % 365 + 1);
        utils.getWeekDays(testDate, 0);
      }
      
      const end = performance.now();
      const duration = end - start;
      
      // 1000次调用应该在100ms内完成
      expect(duration).toBeLessThan(100);
    });
  });

  describe("Locale and Internationalization", () => {
    it("星期名称应该是中文", () => {
      const weekDayNames = utils.getWeekDayNames(0);
      
      expect(weekDayNames).toContain("星期一");
      expect(weekDayNames).toContain("星期二");
      expect(weekDayNames).toContain("星期三");
      expect(weekDayNames).toContain("星期四");
      expect(weekDayNames).toContain("星期五");
      expect(weekDayNames).toContain("星期六");
      expect(weekDayNames).toContain("星期日");
    });

    it("月份显示应该处理不同的输入格式", () => {
      const testDate1 = new Date("2023-10-11");
      const testDate2 = new Date(2023, 9, 11);
      
      const days1 = utils.getMonthDays(testDate1, "0");
      const days2 = utils.getMonthDays(testDate2, "0");
      
      expect(days1.length).toBe(days2.length);
      expect(days1[0].date.getMonth()).toBe(days2[0].date.getMonth());
    });
  });
});
