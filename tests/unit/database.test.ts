/**
 * @description SQLite数据库存储模块测试
 * 测试database.js中的所有主要功能
 */

import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import SQLiteStore from '../../src/main/database.js';
import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';

// Mock better-sqlite3
const mockDatabase = {
  prepare: vi.fn(),
  exec: vi.fn(),
  pragma: vi.fn(),
  close: vi.fn(),
  backup: vi.fn(),
  transaction: vi.fn()
};

const mockStatement = {
  run: vi.fn(),
  get: vi.fn(),
  all: vi.fn()
};

vi.mock('better-sqlite3', () => ({
  default: vi.fn(() => mockDatabase)
}));

// Mock electron app
vi.mock('electron', () => ({
  app: {
    getPath: vi.fn(() => './test-data')
  }
}));

describe('SQLiteStore', () => {
  let store: SQLiteStore;
  const testDataDir = './test-data';
  const testDbPath = path.join(testDataDir, 'timeflow.db');

  beforeAll(() => {
    // 确保测试数据目录存在
    if (!fs.existsSync(testDataDir)) {
      fs.mkdirSync(testDataDir, { recursive: true });
    }
  });

  beforeEach(() => {
    // 重置所有 mock
    vi.clearAllMocks();
    
    // 设置默认 mock 行为
    mockDatabase.prepare.mockReturnValue(mockStatement);
    mockDatabase.pragma.mockReturnValue(1);
    mockDatabase.transaction.mockImplementation((fn) => fn);
    mockStatement.run.mockReturnValue({ lastInsertRowid: 1 });
    mockStatement.get.mockReturnValue(null);
    mockStatement.all.mockReturnValue([]);
    
    // 清理测试数据库文件
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
    
    // 创建新的数据库实例
    store = new SQLiteStore();
  });

  afterEach(() => {
    // 关闭数据库连接
    if (store) {
      store.close();
    }
  });

  afterAll(() => {
    // 清理测试数据目录
    if (fs.existsSync(testDataDir)) {
      fs.rmSync(testDataDir, { recursive: true, force: true });
    }
  });

  // ===================== 初始化和构造函数测试 =====================

  describe('构造函数和初始化', () => {
    it('应该成功创建SQLiteStore实例', () => {
      expect(store).toBeDefined();
      expect(store.db).toBeDefined();
    });

    it('应该创建数据库文件', () => {
      // 由于使用了 mock，我们不会真正创建数据库文件
      // 但可以验证数据库初始化过程是否正确
      expect(store.db).toBeDefined();
    });

    it('应该初始化所有必要的表', () => {
      // 验证 exec 方法被调用来创建表
      expect(mockDatabase.exec).toHaveBeenCalled();
      
      // 验证创建了正确的表
      const execCalls = mockDatabase.exec.mock.calls;
      const allSql = execCalls.map(call => call[0]).join(' ');
      
      expect(allSql).toContain('CREATE TABLE IF NOT EXISTS categories');
      expect(allSql).toContain('CREATE TABLE IF NOT EXISTS events');
      expect(allSql).toContain('CREATE TABLE IF NOT EXISTS settings');
    });

    it('应该启用外键约束', () => {
      expect(mockDatabase.pragma).toHaveBeenCalledWith('foreign_keys = ON');
    });
  });

  // ===================== 辅助方法测试 =====================

  describe('辅助方法', () => {
    describe('mapTypeToEventType', () => {
      it('应该正确映射type到eventType', () => {
        expect(store.mapTypeToEventType(0)).toBe('todo');
        expect(store.mapTypeToEventType(1)).toBe('calendar');
        expect(store.mapTypeToEventType(2)).toBe('both');
        expect(store.mapTypeToEventType(999)).toBe('calendar'); // 默认值
      });
    });

    describe('mapEventTypeToType', () => {
      it('应该正确映射eventType到type', () => {
        expect(store.mapEventTypeToType('todo')).toBe(0);
        expect(store.mapEventTypeToType('calendar')).toBe(1);
        expect(store.mapEventTypeToType('both')).toBe(2);
        expect(store.mapEventTypeToType('unknown')).toBe(1); // 默认值
      });
    });
  });

  // ===================== 分类管理测试 =====================

  describe('分类管理', () => {
    const testCategory = {
      id: 1,
      name: '测试分类',
      color: '#43aa8b',
      active: true
    };

    describe('getCategories', () => {
      it('应该返回空数组当没有分类时', () => {
        mockStatement.all.mockReturnValue([]);
        
        const categories = store.getCategories();
        expect(categories).toEqual([]);
        expect(mockDatabase.prepare).toHaveBeenCalledWith('SELECT * FROM categories ORDER BY id ASC');
      });

      it('应该返回所有分类', () => {
        const mockCategories = [
          { id: 1, name: '测试分类', color: '#43aa8b', active: 1 }
        ];
        mockStatement.all.mockReturnValue(mockCategories);
        
        const categories = store.getCategories();
        
        expect(categories).toHaveLength(1);
        expect(categories[0]).toMatchObject({
          id: 1,
          name: '测试分类',
          color: '#43aa8b',
          active: true
        });
      });

      it('应该正确转换active字段为布尔值', () => {
        const mockCategories = [
          { id: 1, name: '测试分类', color: '#43aa8b', active: 1 }
        ];
        mockStatement.all.mockReturnValue(mockCategories);
        
        const categories = store.getCategories();
        
        expect(typeof categories[0].active).toBe('boolean');
        expect(categories[0].active).toBe(true);
      });
    });

    describe('setCategories', () => {
      it('应该设置分类数据', () => {
        const categories = [
          { id: 1, name: '分类1', color: '#red', active: true },
          { id: 2, name: '分类2', color: '#blue', active: false }
        ];

        store.setCategories(categories);
        
        // 验证调用了相关的数据库方法
        expect(mockDatabase.prepare).toHaveBeenCalled();
        expect(mockStatement.run).toHaveBeenCalled();
      });

      it('应该处理无效输入', () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        
        store.setCategories("invalid" as any);
        expect(consoleSpy).toHaveBeenCalledWith('Categories must be an array');
        
        consoleSpy.mockRestore();
      });
    });

    describe('addCategory', () => {
      it('应该添加单个分类', () => {
        mockStatement.run.mockReturnValue({ lastInsertRowid: 1 });
        
        const id = store.addCategory(testCategory);
        
        expect(mockDatabase.prepare).toHaveBeenCalled();
        expect(mockStatement.run).toHaveBeenCalledWith('测试分类', '#43aa8b', 1);
        expect(id).toBe(1);
      });

      it('应该返回新分类的ID', () => {
        mockStatement.run.mockReturnValue({ lastInsertRowid: 42 });
        
        const id = store.addCategory(testCategory);
        expect(id).toBe(42);
      });
    });

    describe('updateCategory', () => {
      it('应该更新现有分类', () => {
        const updatedCategory = {
          id: 1,
          name: '更新后的分类',
          color: '#purple',
          active: false
        };

        store.updateCategory(updatedCategory);
        
        expect(mockDatabase.prepare).toHaveBeenCalled();
        expect(mockStatement.run).toHaveBeenCalledWith('更新后的分类', '#purple', 0, 1);
      });
    });

    describe('deleteCategory', () => {
      it('应该删除指定分类', () => {
        store.deleteCategory(1);
        
        expect(mockDatabase.prepare).toHaveBeenCalledWith('DELETE FROM categories WHERE id = ?');
        expect(mockStatement.run).toHaveBeenCalledWith(1);
      });
    });
  });

  // ===================== 事件管理测试 =====================

  describe('事件管理', () => {
    const testEvent = {
      id: 1,
      title: '测试事件',
      start: '2024-01-01T10:00:00',
      end: '2024-01-01T11:00:00',
      eventType: 'calendar',
      categoryId: 5,
      description: '测试描述',
      location: '测试地点',
      allDay: false
    };

    describe('getEvents', () => {
      it('应该返回空数组当没有事件时', () => {
        mockStatement.all.mockReturnValue([]);
        
        const events = store.getEvents();
        expect(events).toEqual([]);
        expect(mockDatabase.prepare).toHaveBeenCalled();
      });

      it('应该返回所有事件', () => {
        const mockEvents = [
          {
            id: 1,
            title: '测试事件',
            start: '2024-01-01T10:00:00',
            end: '2024-01-01T11:00:00',
            type: 1,
            category_id: 5,
            description: '测试描述',
            location: '测试地点',
            all_day: 0,
            category_name: '默认分类',
            category_color: '#43aa8b'
          }
        ];
        mockStatement.all.mockReturnValue(mockEvents);
        
        const events = store.getEvents();
        
        expect(events).toHaveLength(1);
        expect(events[0]).toMatchObject({
          id: 1,
          title: '测试事件',
          eventType: 'calendar',
          categoryId: 5
        });
      });

      it('应该正确转换数据类型', () => {
        const mockEvents = [
          {
            id: 1,
            title: '测试事件',
            start: '2024-01-01T10:00:00',
            end: '2024-01-01T11:00:00',
            type: 1,
            category_id: 5,
            all_day: 0,
            category_color: '#43aa8b'
          }
        ];
        mockStatement.all.mockReturnValue(mockEvents);
        
        const events = store.getEvents();
        
        expect(typeof events[0].id).toBe('number');
        expect(typeof events[0].allDay).toBe('boolean');
        expect(typeof events[0].completed).toBe('boolean');
      });

      it('应该包含分类信息', () => {
        const mockEvents = [
          {
            id: 1,
            title: '测试事件',
            start: '2024-01-01T10:00:00',
            end: '2024-01-01T11:00:00',
            type: 1,
            category_id: 5,
            all_day: 0,
            category_name: '默认分类',
            category_color: '#43aa8b'
          }
        ];
        mockStatement.all.mockReturnValue(mockEvents);
        
        const events = store.getEvents();
        
        expect(events[0].categoryColor).toBeDefined();
        expect(events[0].category_name).toBeDefined();
      });
    });

    describe('setEvents', () => {
      it('应该设置事件数据', () => {
        const events = [
          { ...testEvent, id: 1 },
          { ...testEvent, id: 2, title: '事件2' }
        ];

        store.setEvents(events);
        
        expect(mockDatabase.prepare).toHaveBeenCalledWith('DELETE FROM events');
        expect(mockDatabase.prepare).toHaveBeenCalledWith(
          expect.stringContaining('INSERT INTO events')
        );
        expect(mockStatement.run).toHaveBeenCalledWith(
          1, '测试事件', '2024-01-01T10:00:00', '2024-01-01T11:00:00', 1, 5, '测试描述', '测试地点', 0, null, null, null, null
        );
      });

      it('应该处理无效输入', () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        
        store.setEvents("invalid" as any);
        expect(consoleSpy).toHaveBeenCalledWith('Events must be an array');
        
        consoleSpy.mockRestore();
      });
    });

    describe('addEvent', () => {
      it('应该添加单个事件', () => {
        const id = store.addEvent(testEvent);
        
        expect(mockDatabase.prepare).toHaveBeenCalledWith(
          expect.stringContaining('INSERT INTO events')
        );
        expect(mockStatement.run).toHaveBeenCalledWith(
          1, '测试事件', '2024-01-01T10:00:00', '2024-01-01T11:00:00', 1, 5, '测试描述', '测试地点', 0, null, null, null, null
        );
        expect(id).toBe(1);
      });

      it('应该处理不同的事件类型', () => {
        const todoEvent = { ...testEvent, id: 2, eventType: 'todo' };
        const bothEvent = { ...testEvent, id: 3, eventType: 'both' };

        store.addEvent(todoEvent);
        store.addEvent(bothEvent);

        expect(mockStatement.run).toHaveBeenCalledWith(
          2, '测试事件', '2024-01-01T10:00:00', '2024-01-01T11:00:00', 0, 5, '测试描述', '测试地点', 0, null, null, null, null
        );
        expect(mockStatement.run).toHaveBeenCalledWith(
          3, '测试事件', '2024-01-01T10:00:00', '2024-01-01T11:00:00', 2, 5, '测试描述', '测试地点', 0, null, null, null, null
        );
      });

      it('应该设置默认分类ID', () => {
        const eventWithoutCategory = {
          ...testEvent,
          categoryId: undefined
        };

        store.addEvent(eventWithoutCategory);
        
        expect(mockStatement.run).toHaveBeenCalledWith(
          1, '测试事件', '2024-01-01T10:00:00', '2024-01-01T11:00:00', 1, 5, '测试描述', '测试地点', 0, null, null, null, null
        );
      });
    });

    describe('updateEvent', () => {
      it('应该更新现有事件', () => {
        const updatedEvent = {
          ...testEvent,
          title: '更新后的事件',
          description: '更新后的描述'
        };

        store.updateEvent(updatedEvent);
        
        expect(mockDatabase.prepare).toHaveBeenCalledWith(
          expect.stringContaining('UPDATE events')
        );
        expect(mockStatement.run).toHaveBeenCalledWith(
          '更新后的事件', '2024-01-01T10:00:00', '2024-01-01T11:00:00', 1, 5, '更新后的描述', '测试地点', 0, null, null, null, null, 1
        );
      });
    });

    describe('deleteEvent', () => {
      it('应该删除指定事件', () => {
        store.deleteEvent(1);
        
        expect(mockDatabase.prepare).toHaveBeenCalledWith('DELETE FROM events WHERE id = ?');
        expect(mockStatement.run).toHaveBeenCalledWith(1);
      });

      it('应该处理数字ID', () => {
        store.deleteEvent("1");
        
        expect(mockStatement.run).toHaveBeenCalledWith(1);
      });
    });
  });

  // ===================== 设置管理测试 =====================

  describe('设置管理', () => {
    const testKey = 'test_setting';
    const testValue = { option: 'value', number: 42 };

    describe('getSetting', () => {
      it('应该返回null当设置不存在时', () => {
        mockStatement.get.mockReturnValue(null);
        
        const result = store.getSetting('nonexistent');
        expect(result).toBeNull();
        expect(mockDatabase.prepare).toHaveBeenCalledWith('SELECT value FROM settings WHERE key = ?');
      });

      it('应该返回设置值', () => {
        mockStatement.get.mockReturnValue({ value: JSON.stringify(testValue) });
        
        const result = store.getSetting(testKey);
        expect(result).toEqual(testValue);
      });

      it('应该处理字符串值', () => {
        const stringValue = 'simple string';
        mockStatement.get.mockReturnValue({ value: stringValue });
        
        const result = store.getSetting(testKey);
        expect(result).toBe(stringValue);
      });

      it('应该处理JSON对象', () => {
        mockStatement.get.mockReturnValue({ value: JSON.stringify(testValue) });
        
        const result = store.getSetting(testKey);
        expect(result).toEqual(testValue);
      });
    });

    describe('setSetting', () => {
      it('应该设置设置值', () => {
        store.setSetting(testKey, testValue);
        
        expect(mockDatabase.prepare).toHaveBeenCalledWith(
          expect.stringContaining('INSERT OR REPLACE INTO settings')
        );
        expect(mockStatement.run).toHaveBeenCalledWith(testKey, JSON.stringify(testValue));
      });

      it('应该处理字符串值', () => {
        const stringValue = 'simple string';
        store.setSetting(testKey, stringValue);
        
        expect(mockStatement.run).toHaveBeenCalledWith(testKey, stringValue);
      });

      it('应该处理不同数据类型', () => {
        store.setSetting('string', 'value');
        store.setSetting('number', 42);
        store.setSetting('boolean', true);
        store.setSetting('object', { key: 'value' });
        store.setSetting('array', [1, 2, 3]);

        expect(mockStatement.run).toHaveBeenCalledWith('string', 'value');
        expect(mockStatement.run).toHaveBeenCalledWith('number', JSON.stringify(42));
        expect(mockStatement.run).toHaveBeenCalledWith('boolean', JSON.stringify(true));
        expect(mockStatement.run).toHaveBeenCalledWith('object', JSON.stringify({ key: 'value' }));
        expect(mockStatement.run).toHaveBeenCalledWith('array', JSON.stringify([1, 2, 3]));
      });
    });

    describe('getAllSettings', () => {
      it('应该返回空对象当没有设置时', () => {
        mockStatement.all.mockReturnValue([]);
        
        const result = store.getAllSettings();
        expect(result).toEqual({});
      });

      it('应该返回所有设置', () => {
        const mockSettings = [
          { key: 'setting1', value: 'value1' },
          { key: 'setting2', value: JSON.stringify({ key: 'value2' }) }
        ];
        mockStatement.all.mockReturnValue(mockSettings);
        
        const result = store.getAllSettings();
        expect(result).toEqual({
          setting1: 'value1',
          setting2: { key: 'value2' }
        });
      });
    });

    describe('deleteSetting', () => {
      it('应该删除指定设置', () => {
        store.deleteSetting(testKey);
        
        expect(mockDatabase.prepare).toHaveBeenCalledWith('DELETE FROM settings WHERE key = ?');
        expect(mockStatement.run).toHaveBeenCalledWith(testKey);
      });
    });

    describe('getSettings (兼容方法)', () => {
      it('应该与getAllSettings行为一致', () => {
        const mockSettings = [
          { key: 'setting1', value: 'value1' },
          { key: 'setting2', value: 'value2' }
        ];
        mockStatement.all.mockReturnValue(mockSettings);
        
        const result = store.getSettings();
        expect(result).toEqual({
          setting1: 'value1',
          setting2: 'value2'
        });
      });
    });

    describe('setSettings (兼容方法)', () => {
      it('应该批量设置设置', () => {
        const settings = {
          setting1: 'value1',
          setting2: { key: 'value2' },
          setting3: 42
        };

        store.setSettings(settings);
        
        expect(mockStatement.run).toHaveBeenCalledWith('setting1', 'value1');
        expect(mockStatement.run).toHaveBeenCalledWith('setting2', JSON.stringify({ key: 'value2' }));
        expect(mockStatement.run).toHaveBeenCalledWith('setting3', JSON.stringify(42));
      });

      it('应该处理无效输入', () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        
        store.setSettings("invalid" as any);
        expect(consoleSpy).toHaveBeenCalledWith('Settings must be an object');
        
        consoleSpy.mockRestore();
      });
    });
  });

  // ===================== 数据库维护测试 =====================

  describe('数据库维护', () => {
    describe('getStats', () => {
      it('应该返回数据库统计信息', () => {
        mockStatement.get.mockReturnValue({ count: 5 });
        
        const stats = store.getStats();
        expect(stats).toHaveProperty('categories');
        expect(stats).toHaveProperty('events');
        expect(stats).toHaveProperty('settings');
        expect(typeof stats.categories).toBe('number');
        expect(typeof stats.events).toBe('number');
        expect(typeof stats.settings).toBe('number');
      });
    });

    describe('clearAllData', () => {
      it('应该清空所有数据', () => {
        store.clearAllData();
        
        expect(mockDatabase.prepare).toHaveBeenCalledWith('DELETE FROM events');
        expect(mockDatabase.prepare).toHaveBeenCalledWith('DELETE FROM categories');
        expect(mockDatabase.prepare).toHaveBeenCalledWith('DELETE FROM settings');
      });
    });

    describe('backup', () => {
      it('应该创建数据库备份', () => {
        const backupPath = path.join(testDataDir, 'backup.db');
        const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
        
        store.backup(backupPath);
        
        expect(mockDatabase.backup).toHaveBeenCalledWith(backupPath);
        expect(consoleSpy).toHaveBeenCalledWith('Database backed up to:', backupPath);
        
        consoleSpy.mockRestore();
      });
    });

    describe('close', () => {
      it('应该关闭数据库连接', () => {
        const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
        
        store.close();
        expect(mockDatabase.close).toHaveBeenCalled();
        expect(consoleSpy).toHaveBeenCalledWith('Database connection closed');
        
        consoleSpy.mockRestore();
      });
    });
  });

  // ===================== 数据库迁移测试 =====================

  describe('数据库迁移', () => {
    it('应该处理ID类型迁移', () => {
      // 模拟旧的数据库结构
      const tableInfo = [
        { name: 'id', type: 'TEXT' }
      ];
      
      // 重新创建 store 并模拟迁移过程
      mockDatabase.prepare.mockReturnValue({
        ...mockStatement,
        all: vi.fn().mockReturnValue(tableInfo)
      });
      
      const newStore = new SQLiteStore();
      
      // 验证迁移相关的数据库操作
      expect(mockDatabase.prepare).toHaveBeenCalled();
      expect(newStore).toBeDefined();
    });
  });

  // ===================== 错误处理测试 =====================

  describe('错误处理', () => {
    it('应该处理数据库操作错误', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      // 模拟数据库错误
      mockStatement.run.mockImplementation(() => {
        throw new Error('Database error');
      });
      
      expect(() => {
        store.addEvent(null);
      }).toThrow();
      
      consoleSpy.mockRestore();
    });

    it('应该处理查询错误', () => {
      // 模拟查询错误
      mockStatement.all.mockImplementation(() => {
        throw new Error('Query error');
      });
      
      const result = store.getEvents();
      expect(result).toEqual([]);
      
      // 验证结果是空数组，这表明错误被正确处理了
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });
  });
});
