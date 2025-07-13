/**
 * @file database.js
 * @description SQLite 数据库存储模块，负责管理应用的所有持久化数据，包括事件、分类和设置。
 * 
 * 为什么这样做：
 * - 通过集中管理数据库操作，确保数据结构一致性和业务逻辑可维护性，避免分散存储导致的混乱和数据丢失。
 * - 使用 Electron 用户数据目录存储数据库文件，保证数据隔离且随用户账户迁移，提升安全性和跨平台兼容性。
 * - 自动初始化表结构和触发器，确保每次启动都能自愈数据库，减少因升级或异常导致的数据损坏。
 * - 默认数据和结构迁移逻辑，保证新用户和老用户都能无缝使用，降低维护成本。
 * - 所有操作均接入日志系统，便于问题定位和数据追踪。
 * - 分类、事件、设置等核心业务均提供批量和单项操作，支持事务，保证数据一致性和性能。
 * - 提供辅助方法（如类型映射、统计、备份、清空等），方便扩展和维护。
 */

import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { app } from "electron";
import logger from "./logger.js";

// 获取当前文件目录，便于定位资源和跨平台兼容
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class SQLiteStore {
  constructor() {
    logger.info("Initializing SQLite database store");

    // 使用 Electron 用户数据目录存储数据库，保证数据隔离和安全
    const dataDir = app.getPath("userData");
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
      logger.info("Created user data directory", { dataDir });
    }

    // 数据库文件路径
    const dbPath = path.join(dataDir, "timeflow.db");

    try {
      // 初始化数据库连接
      this.db = new Database(dbPath);

      // 启用外键约束，保证数据完整性
      this.db.pragma("foreign_keys = ON");

      // 初始化表结构和触发器，保证每次启动都能自愈
      this.initializeDatabase();

      // 处理历史结构变更，保证升级兼容
      this.migrateDatabase();

      logger.info("SQLite database initialized successfully", { dbPath });
    } catch (error) {
      logger.error("Failed to initialize SQLite database", error);
      throw error;
    }
  }

  /**
   * 初始化数据库表结构和触发器
   * 为什么这样做：自动建表和触发器，保证数据结构一致性和时间戳自动更新，减少人为错误。
   */
  initializeDatabase() {
    try {
      logger.info("Initializing database tables");

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
      logger.database("CREATE", "categories", { action: "table_created" });

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
      logger.database("CREATE", "events", { action: "table_created" });

      // 创建设置表
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS settings (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);
      logger.database("CREATE", "settings", { action: "table_created" });

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
      logger.database("CREATE", "triggers", { action: "triggers_created" });

      // 初始化默认分类数据
      this.initializeDefaultCategories();

      logger.info("Database tables initialized successfully");
    } catch (error) {
      logger.error("Failed to initialize database tables", error);
      throw error;
    }
  }

  /**
   * 初始化默认分类数据
   * 为什么这样做：首次启动时自动填充默认分类，保证前端有内容可用，避免空白页面。
   */
  initializeDefaultCategories() {
    try {
      // 检查分类表是否为空
      const categoryCount = this.db
        .prepare("SELECT COUNT(*) as count FROM categories")
        .get().count;
      logger.database("SELECT", "categories", {
        action: "count_check",
        count: categoryCount,
      });

      if (categoryCount === 0) {
        logger.info("No categories found, initializing default categories");

        const defaultCategories = [
          { name: "Others", color: "#e63946", active: true },
        ];

        const insertStmt = this.db.prepare(`
          INSERT INTO categories (name, color, active)
          VALUES (?, ?, ?)
        `);

        for (const category of defaultCategories) {
          insertStmt.run(
            category.name,
            category.color,
            category.active ? 1 : 0
          );
        }
      }
    } catch (error) {
      console.error("Failed to initialize default categories:", error);
    }
  }

  /**
   * 迁移数据库结构（如ID类型变更）
   * 为什么这样做：自动处理历史结构变更，保证老用户数据不丢失，升级无缝。
   */
  migrateDatabase() {
    try {
      // 检查events表的id字段类型
      const tableInfo = this.db.prepare("PRAGMA table_info(events)").all();
      const idColumn = tableInfo.find((col) => col.name === "id");

      if (idColumn && idColumn.type === "TEXT") {
        console.log("Migrating events table from TEXT id to INTEGER id...");

        // 备份现有数据
        const existingEvents = this.db.prepare("SELECT * FROM events").all();

        // 删除现有表
        this.db.exec("DROP TABLE IF EXISTS events");

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
              console.warn("Failed to migrate event:", event.id, err);
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

        console.log("Database migration completed successfully");
      }
    } catch (error) {
      console.error("Failed to migrate database:", error);
    }
  }

  // ===================== 辅助方法 =====================

  /**
   * 类型映射：数据库 type <-> 前端 eventType
   * 为什么这样做：前后端类型不一致时自动转换，保证数据流畅对接。
   */
  mapTypeToEventType(type) {
    switch (type) {
      case 0:
        return "todo";
      case 1:
        return "calendar";
      case 2:
        return "both";
      default:
        return "calendar";
    }
  }

  /**
   * 将前端的eventType映射为数据库的type字段
   * @param {string} eventType 前端eventType字符串
   * @returns {number} 数据库type值
   */
  mapEventTypeToType(eventType) {
    switch (eventType) {
      case "todo":
        return 0;
      case "calendar":
        return 1;
      case "both":
        return 2;
      default:
        return 1;
    }
  }

  // ===================== 分类管理 =====================

  /**
   * 获取所有分类
   * 为什么这样做：统一入口获取分类，自动类型转换，便于前端直接使用。
   */
  getCategories() {
    try {
      logger.database("SELECT", "categories", { action: "get_all" });
      const stmt = this.db.prepare("SELECT * FROM categories ORDER BY id ASC");
      const categories = stmt.all();

      logger.database("SELECT", "categories", {
        action: "get_all_result",
        count: categories.length,
      });

      // 转换数据类型
      return categories.map((category) => ({
        ...category,
        active: Boolean(category.active),
      }));
    } catch (error) {
      console.error("Failed to get categories:", error);
      return [];
    }
  }

  /**
   * 批量设置分类
   * 为什么这样做：支持批量导入和覆盖，事务保证一致性，提升性能。
   */
  setCategories(categories) {
    if (!Array.isArray(categories)) {
      console.error("Categories must be an array");
      return;
    }

    try {
      // 使用事务确保数据一致性
      const transaction = this.db.transaction(() => {
        // 清空现有分类
        this.db.prepare("DELETE FROM categories").run();

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
      console.log("Categories saved successfully");
    } catch (error) {
      console.error("Failed to save categories:", error);
    }
  }

  /**
   * 添加单个分类
   * 为什么这样做：便于前端快速新增分类，返回新ID便于后续操作。
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
      console.error("Failed to add category:", error);
      throw error;
    }
  }

  /**
   * 更新分类
   * 为什么这样做：支持分类编辑，保证数据实时同步。
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
      console.error("Failed to update category:", error);
      throw error;
    }
  }

  /**
   * 删除分类
   * 为什么这样做：支持分类删除，自动级联处理相关数据。
   */
  deleteCategory(categoryId) {
    try {
      const stmt = this.db.prepare("DELETE FROM categories WHERE id = ?");
      stmt.run(categoryId);
    } catch (error) {
      console.error("Failed to delete category:", error);
      throw error;
    }
  }

  // ===================== 事件管理 =====================

  /**
   * 获取所有事件
   * 为什么这样做：统一入口获取事件，自动类型和字段映射，便于前端直接渲染。
   */
  getEvents() {
    try {
      logger.database("SELECT", "events", {
        action: "get_all_with_categories",
      });

      const stmt = this.db.prepare(`
        SELECT e.*, c.name as category_name, c.color as category_color
        FROM events e
        LEFT JOIN categories c ON e.category_id = c.id
        ORDER BY e.start ASC
      `);

      const events = stmt.all();

      logger.database("SELECT", "events", {
        action: "get_all_result",
        count: events.length,
      });

      // 转换数据类型并映射字段名以匹配前端期望的格式
      return events.map((event) => {
        // 确保分类颜色有默认值
        const categoryColor = event.category_color || "#43aa8b";

        return {
          id: Number(event.id), // 确保ID是数字类型
          title: event.title,
          start: event.start,
          end: event.end,
          eventType: this.mapTypeToEventType(Number(event.type)), // 显射数据库type到前端eventType
          categoryId: event.category_id ? Number(event.category_id) : 5, // 显射category_id到categoryId，默认为5
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
          category_name: event.category_name,
        };
      });
    } catch (error) {
      logger.error("Failed to get events", error);
      return [];
    }
  }

  /**
   * 批量设置事件
   * 为什么这样做：支持批量导入和覆盖，事务保证一致性，提升性能。
   */
  setEvents(events) {
    if (!Array.isArray(events)) {
      console.error("Events must be an array");
      return;
    }

    try {
      // 使用事务确保数据一致性
      const transaction = this.db.transaction(() => {
        // 清空现有事件
        this.db.prepare("DELETE FROM events").run();

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
            event.allDay || event.all_day ? 1 : 0, // 处理allDay到all_day的映射
            event.color || event.categoryColor || null,
            event.background_color || event.backgroundColor || null,
            event.border_color || event.borderColor || null,
            event.text_color || event.textColor || null
          );
        }
      });

      transaction();
      console.log("Events saved successfully");
    } catch (error) {
      console.error("Failed to save events:", error);
    }
  }

  /**
   * 添加单个事件
   * 为什么这样做：便于前端快速新增事件，返回新ID便于后续操作。
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
        event.allDay || event.all_day ? 1 : 0,
        event.color || event.categoryColor || null,
        event.background_color || event.backgroundColor || null,
        event.border_color || event.borderColor || null,
        event.text_color || event.textColor || null
      );

      return Number(event.id);
    } catch (error) {
      console.error("Failed to add event:", error);
      throw error;
    }
  }

  /**
   * 更新事件
   * 为什么这样做：支持事件编辑，保证数据实时同步。
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
        event.allDay || event.all_day ? 1 : 0,
        event.color || event.categoryColor || null,
        event.background_color || event.backgroundColor || null,
        event.border_color || event.borderColor || null,
        event.text_color || event.textColor || null,
        Number(event.id) // 确保ID是数字
      );
    } catch (error) {
      console.error("Failed to update event:", error);
      throw error;
    }
  }

  /**
   * 删除事件
   * 为什么这样做：支持事件删除，自动处理相关依赖。
   */
  deleteEvent(eventId) {
    try {
      const stmt = this.db.prepare("DELETE FROM events WHERE id = ?");
      stmt.run(Number(eventId)); // 确保ID是数字
    } catch (error) {
      console.error("Failed to delete event:", error);
      throw error;
    }
  }

  // ===================== 设置管理 =====================

  /**
   * 获取单项设置
   * 为什么这样做：便于前端按需获取配置，自动解析 JSON。
   */
  getSetting(key) {
    try {
      const stmt = this.db.prepare("SELECT value FROM settings WHERE key = ?");
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
      console.error("Failed to get setting:", error);
      return null;
    }
  }

  /**
   * 设置单项配置
   * 为什么这样做：支持前端灵活保存配置，自动序列化。
   */
  setSetting(key, value) {
    try {
      const stmt = this.db.prepare(`
        INSERT OR REPLACE INTO settings (key, value) 
        VALUES (?, ?)
      `);

      const serializedValue =
        typeof value === "string" ? value : JSON.stringify(value);
      stmt.run(key, serializedValue);
    } catch (error) {
      console.error("Failed to set setting:", error);
      throw error;
    }
  }

  /**
   * 获取所有设置
   * 为什么这样做：批量获取所有配置，便于前端初始化和同步。
   */
  getAllSettings() {
    try {
      const stmt = this.db.prepare("SELECT key, value FROM settings");
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
      console.error("Failed to get all settings:", error);
      return {};
    }
  }

  /**
   * 删除单项设置
   * 为什么这样做：支持配置项删除，提升灵活性。
   */
  deleteSetting(key) {
    try {
      const stmt = this.db.prepare("DELETE FROM settings WHERE key = ?");
      stmt.run(key);
    } catch (error) {
      console.error("Failed to delete setting:", error);
      throw error;
    }
  }

  // ===================== 设置管理 (兼容方法) =====================

  /**
   * 兼容方法：获取所有设置
   */
  getSettings() {
    return this.getAllSettings();
  }

  /**
   * 兼容方法：批量设置所有配置
   */
  setSettings(settings) {
    if (typeof settings !== "object" || settings === null) {
      console.error("Settings must be an object");
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
          const serializedValue =
            typeof value === "string" ? value : JSON.stringify(value);
          stmt.run(key, serializedValue);
        }
      });

      transaction();
      console.log("Settings saved successfully");
    } catch (error) {
      console.error("Failed to save settings:", error);
      throw error;
    }
  }

  // ===================== 数据库维护 =====================

  /**
   * 关闭数据库连接
   * 为什么这样做：释放资源，防止内存泄漏。
   */
  close() {
    try {
      if (this.db) {
        this.db.close();
        console.log("Database connection closed");
      }
    } catch (error) {
      console.error("Failed to close database:", error);
    }
  }

  /**
   * 备份数据库
   * 为什么这样做：支持数据迁移和灾备，提升安全性。
   */
  backup(backupPath) {
    try {
      this.db.backup(backupPath);
      console.log("Database backed up to:", backupPath);
    } catch (error) {
      console.error("Failed to backup database:", error);
      throw error;
    }
  }

  /**
   * 获取数据库统计信息
   * 为什么这样做：便于前端展示和运维监控。
   */
  getStats() {
    try {
      const categoriesCount = this.db
        .prepare("SELECT COUNT(*) as count FROM categories")
        .get().count;
      const eventsCount = this.db
        .prepare("SELECT COUNT(*) as count FROM events")
        .get().count;
      const settingsCount = this.db
        .prepare("SELECT COUNT(*) as count FROM settings")
        .get().count;

      return {
        categories: categoriesCount,
        events: eventsCount,
        settings: settingsCount,
      };
    } catch (error) {
      console.error("Failed to get database stats:", error);
      return { categories: 0, events: 0, settings: 0 };
    }
  }

  /**
   * 清空所有数据
   * 为什么这样做：支持一键重置，便于调试和用户自助清理。
   */
  clearAllData() {
    try {
      const transaction = this.db.transaction(() => {
        this.db.prepare("DELETE FROM events").run();
        this.db.prepare("DELETE FROM categories").run();
        this.db.prepare("DELETE FROM settings").run();
      });

      transaction();
      console.log("All data cleared successfully");
    } catch (error) {
      console.error("Failed to clear all data:", error);
      throw error;
    }
  }
}

export default SQLiteStore;
