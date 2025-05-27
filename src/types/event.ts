export interface Event {
    id: number;
    title: string;
    start: Date;
    end: Date;
    description: string;
    categoryId: number;
    categoryColor: string;
    allDay: boolean;
    addToTodo: boolean;
    eventType: 'todo' | 'event';  // 添加事件类型
    completed: boolean;           // 添加完成状态
}