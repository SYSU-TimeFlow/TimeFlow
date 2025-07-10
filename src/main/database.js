/**
 * @description SQLite 数据库存储模块
 * @description 负责管理应用的数据存储，包括事件、分类和设置
 */
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { app } from 'electron';

// 获取当前文件目录
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class SQLiteStore {
  constructor() {
    // 使用 Electron 的用户数据目录，而不是应用目录
    const dataDir = app.getPath('userData');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    // 数据库文件路径
    const dbPath = path.join(dataDir, 'timeflow.db');
    
    try {
      // 初始化 SQLite 数据库连接
      this.db = new Database(dbPath);
      
      // 启用外键约束
      this.db.pragma('foreign_keys = ON');
      
      // 初始化数据库表结构
      this.initializeDatabase();
      
      // 迁移数据库（处理结构变化）
      this.migrateDatabase();
      
      console.log('SQLite database initialized successfully at:', dbPath);
    } catch (error) {
      console.error('Failed to initialize SQLite database:', error);
      throw error;
    }
  }

  /**
   * 初始化数据库表结构
   */
  initializeDatabase() {
    try {
      // 创建分类表
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS categories (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          color TEXT NOT NULL,
          active BOOLEAN DEFAULT true,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // 创建事件表
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS events (
          id INTEGER PRIMARY KEY,
          title TEXT NOT NULL,
          start TEXT NOT NULL,
          end TEXT NOT NULL,
          type INTEGER DEFAULT 1,
          category_id INTEGER,
          description TEXT,
          location TEXT,
          all_day BOOLEAN DEFAULT false,
          color TEXT,
          background_color TEXT,
          border_color TEXT,
          text_color TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
        )
      `);

      // 创建设置表
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS settings (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // 创建更新触发器
      this.db.exec(`
        CREATE TRIGGER IF NOT EXISTS update_categories_timestamp 
        AFTER UPDATE ON categories
        BEGIN
          UPDATE categories SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
        END
      `);

      this.db.exec(`
        CREATE TRIGGER IF NOT EXISTS update_events_timestamp 
        AFTER UPDATE ON events
        BEGIN
          UPDATE events SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
        END
      `);

      this.db.exec(`
        CREATE TRIGGER IF NOT EXISTS update_settings_timestamp 
        AFTER UPDATE ON settings
        BEGIN
          UPDATE settings SET updated_at = CURRENT_TIMESTAMP WHERE key = NEW.key;
        END
      `);

      // 初始化默认分类数据
      this.initializeDefaultCategories();

      console.log('Database tables initialized successfully');
    } catch (error) {
      console.error('Failed to initialize database tables:', error);
      throw error;
    }
  }

  /**
   * 初始化默认分类数据
   * 在第一次创建数据库时添加默认分类
   */
  initializeDefaultCategories() {
    try {
      // 检查分类表是否为空
      const categoryCount = this.db.prepare('SELECT COUNT(*) as count FROM categories').get().count;
      if (categoryCount === 0) {
        
        const defaultCategories = [
          { name: 'Other', color: '#e63946', active: true }
        ];
        
        const insertStmt = this.db.prepare(`
          INSERT INTO categories (name, color, active)
          VALUES (?, ?, ?)
        `);
        
        for (const category of defaultCategories) {
          insertStmt.run(category.name, category.color, category.active ? 1 : 0);
        }
        
      }
    } catch (error) {
      console.error('Failed to initialize default categories:', error);
    }
  }

  /**
   * 迁移数据库结构（处理ID类型变化）
   */
  migrateDatabase() {
    try {
      // 检查events表的id字段类型
      const tableInfo = this.db.prepare("PRAGMA table_info(events)").all();
      const idColumn = tableInfo.find(col => col.name === 'id');
      
      if (idColumn && idColumn.type === 'TEXT') {
        console.log('Migrating events table from TEXT id to INTEGER id...');
        
        // 备份现有数据
        const existingEvents = this.db.prepare('SELECT * FROM events').all();
        
        // 删除现有表
        this.db.exec('DROP TABLE IF EXISTS events');
        
        // 重新创建表
        this.db.exec(`
          CREATE TABLE events (
            id INTEGER PRIMARY KEY,
            title TEXT NOT NULL,
            start TEXT NOT NULL,
            end TEXT NOT NULL,
            type INTEGER DEFAULT 1,
            category_id INTEGER,
            description TEXT,
            location TEXT,
            all_day BOOLEAN DEFAULT false,
            color TEXT,
            background_color TEXT,
            border_color TEXT,
            text_color TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
          )
        `);
        
        // 恢复数据，转换ID为数字
        if (existingEvents.length > 0) {
          const insertStmt = this.db.prepare(`
            INSERT INTO events (
              id, title, start, end, type, category_id, description, 
              location, all_day, color, background_color, border_color, text_color
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `);
          
          for (const event of existingEvents) {
            try {
              insertStmt.run(
                Number(event.id) || Date.now() + Math.random(), // 转换为数字，如果失败则生成新ID
                event.title,
                event.start,
                event.end,
                event.type || 1,
                event.category_id || 5,
                event.description,
                event.location,
                event.all_day ? 1 : 0,
                event.color,
                event.background_color,
                event.border_color,
                event.text_color
              );
            } catch (err) {
              console.warn('Failed to migrate event:', event.id, err);
            }
          }
        }
        
        // 重新创建触发器
        this.db.exec(`
          CREATE TRIGGER IF NOT EXISTS update_events_timestamp 
          AFTER UPDATE ON events
          BEGIN
            UPDATE events SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
          END
        `);
        
        console.log('Database migration completed successfully');
      }
    } catch (error) {
      console.error('Failed to migrate database:', error);
    }
  }

  // ===================== 辅助方法 =====================

  /**
   * 将数据库中的type字段映射为前端的eventType
   * @param {number} type 数据库中的类型值
   * @returns {string} 前端eventType字符串
   */
  mapTypeToEventType(type) {
    switch (type) {
      case 0: return "todo";
      case 1: return "calendar";
      case 2: return "both";
      default: return "calendar";
    }
  }

  /**
   * 将前端的eventType映射为数据库的type字段
   * @param {string} eventType 前端eventType字符串
   * @returns {number} 数据库type值
   */
  mapEventTypeToType(eventType) {
    switch (eventType) {
      case "todo": return 0;
      case "calendar": return 1;
      case "both": return 2;
      default: return 1;
    }
  }

  // ===================== 分类管理 =====================

  /**
   * 获取所有分类
   * @returns {Array} 分类数组
   */
  getCategories() {
    try {
      const stmt = this.db.prepare('SELECT * FROM categories ORDER BY id ASC');
      const categories = stmt.all();
      
      // 转换数据类型
      return categories.map(category => ({
        ...category,
        active: Boolean(category.active)
      }));
    } catch (error) {
      console.error('Failed to get categories:', error);
      return [];
    }
  }

  /**
   * 设置分类数据
   * @param {Array} categories 分类数组
   */
  setCategories(categories) {
    if (!Array.isArray(categories)) {
      console.error('Categories must be an array');
      return;
    }

    try {
      // 使用事务确保数据一致性
      const transaction = this.db.transaction(() => {
        // 清空现有分类
        this.db.prepare('DELETE FROM categories').run();
        
        // 插入新分类
        const insertStmt = this.db.prepare(`
          INSERT INTO categories (id, name, color, active) 
          VALUES (?, ?, ?, ?)
        `);
        
        for (const category of categories) {
          insertStmt.run(
            category.id,
            category.name,
            category.color,
            category.active ? 1 : 0
          );
        }
      });

      transaction();
      console.log('Categories saved successfully');
    } catch (error) {
      console.error('Failed to save categories:', error);
    }
  }

  /**
   * 添加单个分类
   * @param {Object} category 分类对象
   * @returns {number} 新分类的ID
   */
  addCategory(category) {
    try {
      const stmt = this.db.prepare(`
        INSERT INTO categories (name, color, active) 
        VALUES (?, ?, ?)
      `);
      
      const result = stmt.run(
        category.name,
        category.color,
        category.active ? 1 : 0
      );
      
      return result.lastInsertRowid;
    } catch (error) {
      console.error('Failed to add category:', error);
      throw error;
    }
  }

  /**
   * 更新分类
   * @param {Object} category 分类对象
   */
  updateCategory(category) {
    try {
      const stmt = this.db.prepare(`
        UPDATE categories 
        SET name = ?, color = ?, active = ? 
        WHERE id = ?
      `);
      
      stmt.run(
        category.name,
        category.color,
        category.active ? 1 : 0,
        category.id
      );
    } catch (error) {
      console.error('Failed to update category:', error);
      throw error;
    }
  }

  /**
   * 删除分类
   * @param {number} categoryId 分类ID
   */
  deleteCategory(categoryId) {
    try {
      const stmt = this.db.prepare('DELETE FROM categories WHERE id = ?');
      stmt.run(categoryId);
    } catch (error) {
      console.error('Failed to delete category:', error);
      throw error;
    }
  }

  // ===================== 事件管理 =====================

  /**
   * 获取所有事件
   * @returns {Array} 事件数组
   */
  getEvents() {
    try {
      const stmt = this.db.prepare(`
        SELECT e.*, c.name as category_name, c.color as category_color
        FROM events e
        LEFT JOIN categories c ON e.category_id = c.id
        ORDER BY e.start ASC
      `);
      
      const events = stmt.all();
      
      // 转换数据类型并映射字段名以匹配前端期望的格式
      return events.map(event => {
        // 确保分类颜色有默认值
        const categoryColor = event.category_color || '#43aa8b';
        
        return {
          id: Number(event.id), // 确保ID是数字类型
          title: event.title,
          start: event.start,
          end: event.end,
          eventType: this.mapTypeToEventType(Number(event.type)), // 映射数据库type到前端eventType
          categoryId: event.category_id ? Number(event.category_id) : 5, // 映射category_id到categoryId，默认为5
          categoryColor: categoryColor, // 使用分类颜色
          description: event.description || "",
          location: event.location || "",
          allDay: Boolean(event.all_day), // 显示all_day到allDay
          completed: false, // 默认未完成
          // 保留原始数据库字段，以防需要
          color: event.color || categoryColor,
          background_color: event.background_color,
          border_color: event.border_color,
          text_color: event.text_color,
          // 分类信息
          category_name: event.category_name
        };
      });
    } catch (error) {
      console.error('Failed to get events:', error);
      return [];
    }
  }

  /**
   * 设置事件数据
   * @param {Array} events 事件数组
   */
  setEvents(events) {
    if (!Array.isArray(events)) {
      console.error('Events must be an array');
      return;
    }

    try {
      // 使用事务确保数据一致性
      const transaction = this.db.transaction(() => {
        // 清空现有事件
        this.db.prepare('DELETE FROM events').run();
        
        // 插入新事件
        const insertStmt = this.db.prepare(`
          INSERT INTO events (
            id, title, start, end, type, category_id, description, 
            location, all_day, color, background_color, border_color, text_color
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        
        for (const event of events) {
          insertStmt.run(
            Number(event.id), // 确保ID是数字
            event.title,
            event.start,
            event.end,
            this.mapEventTypeToType(event.eventType || event.type), // 处理eventType到type的映射
            event.categoryId || event.category_id || 5, // 处理categoryId到category_id的映射，默认为5
            event.description || null,
            event.location || null,
            (event.allDay || event.all_day) ? 1 : 0, // 处理allDay到all_day的映射
            event.color || event.categoryColor || null,
            event.background_color || event.backgroundColor || null,
            event.border_color || event.borderColor || null,
            event.text_color || event.textColor || null
          );
        }
      });

      transaction();
      console.log('Events saved successfully');
    } catch (error) {
      console.error('Failed to save events:', error);
    }
  }

  /**
   * 添加单个事件
   * @param {Object} event 事件对象
   * @returns {number} 事件ID
   */
  addEvent(event) {
    try {
      const stmt = this.db.prepare(`
        INSERT INTO events (
          id, title, start, end, type, category_id, description, 
          location, all_day, color, background_color, border_color, text_color
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      stmt.run(
        Number(event.id), // 确保ID是数字
        event.title,
        event.start,
        event.end,
        this.mapEventTypeToType(event.eventType || event.type),
        event.categoryId || event.category_id || 5, // 默认分类5
        event.description || null,
        event.location || null,
        (event.allDay || event.all_day) ? 1 : 0,
        event.color || event.categoryColor || null,
        event.background_color || event.backgroundColor || null,
        event.border_color || event.borderColor || null,
        event.text_color || event.textColor || null
      );
      
      return Number(event.id);
    } catch (error) {
      console.error('Failed to add event:', error);
      throw error;
    }
  }

  /**
   * 更新事件
   * @param {Object} event 事件对象
   */
  updateEvent(event) {
    try {
      const stmt = this.db.prepare(`
        UPDATE events 
        SET title = ?, start = ?, end = ?, type = ?, category_id = ?, 
            description = ?, location = ?, all_day = ?, color = ?, 
            background_color = ?, border_color = ?, text_color = ?
        WHERE id = ?
      `);
      
      stmt.run(
        event.title,
        event.start,
        event.end,
        this.mapEventTypeToType(event.eventType || event.type),
        event.categoryId || event.category_id || 5, // 默认分类5
        event.description || null,
        event.location || null,
        (event.allDay || event.all_day) ? 1 : 0,
        event.color || event.categoryColor || null,
        event.background_color || event.backgroundColor || null,
        event.border_color || event.borderColor || null,
        event.text_color || event.textColor || null,
        Number(event.id) // 确保ID是数字
      );
    } catch (error) {
      console.error('Failed to update event:', error);
      throw error;
    }
  }

  /**
   * 删除事件
   * @param {number} eventId 事件ID
   */
  deleteEvent(eventId) {
    try {
      const stmt = this.db.prepare('DELETE FROM events WHERE id = ?');
      stmt.run(Number(eventId)); // 确保ID是数字
    } catch (error) {
      console.error('Failed to delete event:', error);
      throw error;
    }
  }

  // ===================== 设置管理 =====================

  /**
   * 获取设置值
   * @param {string} key 设置键
   * @returns {any} 设置值
   */
  getSetting(key) {
    try {
      const stmt = this.db.prepare('SELECT value FROM settings WHERE key = ?');
      const row = stmt.get(key);
      
      if (row) {
        try {
          return JSON.parse(row.value);
        } catch (e) {
          return row.value;
        }
      }
      
      return null;
    } catch (error) {
      console.error('Failed to get setting:', error);
      return null;
    }
  }

  /**
   * 设置设置值
   * @param {string} key 设置键
   * @param {any} value 设置值
   */
  setSetting(key, value) {
    try {
      const stmt = this.db.prepare(`
        INSERT OR REPLACE INTO settings (key, value) 
        VALUES (?, ?)
      `);
      
      const serializedValue = typeof value === 'string' ? value : JSON.stringify(value);
      stmt.run(key, serializedValue);
    } catch (error) {
      console.error('Failed to set setting:', error);
      throw error;
    }
  }

  /**
   * 获取所有设置
   * @returns {Object} 设置对象
   */
  getAllSettings() {
    try {
      const stmt = this.db.prepare('SELECT key, value FROM settings');
      const rows = stmt.all();
      
      const settings = {};
      for (const row of rows) {
        try {
          settings[row.key] = JSON.parse(row.value);
        } catch (e) {
          settings[row.key] = row.value;
        }
      }
      
      return settings;
    } catch (error) {
      console.error('Failed to get all settings:', error);
      return {};
    }
  }

  /**
   * 删除设置
   * @param {string} key 设置键
   */
  deleteSetting(key) {
    try {
      const stmt = this.db.prepare('DELETE FROM settings WHERE key = ?');
      stmt.run(key);
    } catch (error) {
      console.error('Failed to delete setting:', error);
      throw error;
    }
  }

  // ===================== 设置管理 (兼容方法) =====================

  /**
   * 获取所有设置 (兼容方法)
   * @returns {Object} 设置对象
   */
  getSettings() {
    return this.getAllSettings();
  }

  /**
   * 设置所有设置 (兼容方法)
   * @param {Object} settings 设置对象
   */
  setSettings(settings) {
    if (typeof settings !== 'object' || settings === null) {
      console.error('Settings must be an object');
      return;
    }

    try {
      // 使用事务批量更新设置
      const transaction = this.db.transaction(() => {
        const stmt = this.db.prepare(`
          INSERT OR REPLACE INTO settings (key, value) 
          VALUES (?, ?)
        `);
        
        for (const [key, value] of Object.entries(settings)) {
          const serializedValue = typeof value === 'string' ? value : JSON.stringify(value);
          stmt.run(key, serializedValue);
        }
      });

      transaction();
      console.log('Settings saved successfully');
    } catch (error) {
      console.error('Failed to save settings:', error);
      throw error;
    }
  }

  // ===================== 数据库维护 =====================

  /**
   * 关闭数据库连接
   */
  close() {
    try {
      if (this.db) {
        this.db.close();
        console.log('Database connection closed');
      }
    } catch (error) {
      console.error('Failed to close database:', error);
    }
  }

  /**
   * 备份数据库
   * @param {string} backupPath 备份文件路径
   */
  backup(backupPath) {
    try {
      this.db.backup(backupPath);
      console.log('Database backed up to:', backupPath);
    } catch (error) {
      console.error('Failed to backup database:', error);
      throw error;
    }
  }

  /**
   * 获取数据库统计信息
   * @returns {Object} 统计信息
   */
  getStats() {
    try {
      const categoriesCount = this.db.prepare('SELECT COUNT(*) as count FROM categories').get().count;
      const eventsCount = this.db.prepare('SELECT COUNT(*) as count FROM events').get().count;
      const settingsCount = this.db.prepare('SELECT COUNT(*) as count FROM settings').get().count;
      
      return {
        categories: categoriesCount,
        events: eventsCount,
        settings: settingsCount
      };
    } catch (error) {
      console.error('Failed to get database stats:', error);
      return { categories: 0, events: 0, settings: 0 };
    }
  }

  /**
   * 清空所有数据
   */
  clearAllData() {
    try {
      const transaction = this.db.transaction(() => {
        this.db.prepare('DELETE FROM events').run();
        this.db.prepare('DELETE FROM categories').run();
        this.db.prepare('DELETE FROM settings').run();
      });

      transaction();
      console.log('All data cleared successfully');
    } catch (error) {
      console.error('Failed to clear all data:', error);
      throw error;
    }
  }
}

export default SQLiteStore;
