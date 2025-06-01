<!-- 
 @component CalendarMain.vue
 @description: 主日历组件，负责展示月、周、日视图以及相关的事件。 
-->

<template>
  <!-- 主日历区域容器 - 保留overflow-auto并增强滚动行为 -->
  <main
    class="calendar-main flex-1 flex flex-col overflow-auto custom-scrollbar"
  >
    <!-- 月视图容器 - 修改overflow-auto为overflow-visible，让父容器控制滚动 -->
    <div
      v-if="uiStore.currentView === 'month'"
      class="calendar-grid flex-1 overflow-visible p-6"
    >
      <!-- 星期头部 -->
      <div class="grid grid-cols-7 mb-2">
        <div
          v-for="day in getWeekDayNames(settingStore.weekStart)"
          :key="day"
          class="text-sm font-medium text-gray-500 pb-2 text-center"
        >
          {{ day }}
        </div>
      </div>
      <!-- 日期格子容器 -->
      <div class="grid grid-cols-7 grid-rows-6 gap-1 h-full">
        <!-- 单个日期格子 -->
        <div
          v-for="(day, index) in getMonthDays(
            new Date(uiStore.currentDate),
            settingStore.weekStart
          )"
          :key="index"
          :class="[
            'calendar-day border border-gray-200 h-[180px] p-1 relative flex flex-col', // MODIFIED: Added flex flex-col
            day.isCurrentMonth ? 'bg-white' : 'bg-gray-200',
            day.isToday ? 'today' : '',
            day.isWeekend ? 'weekend' : '',
          ]"
          @click="uiStore.handleDayClick(day, true)"
          @dragover.prevent
          @drop="uiStore.handleMonthDrop($event, day)"
        >
          <!-- 日期头部，包含日期数字和添加事件按钮 -->
          <div
            :class="[
              'day-header flex justify-between items-center p-1 rounded-t bg-inherit flex-shrink-0',
              day.isToday ? 'bg-blue-50' : '',
            ]"
          >
            <span
              :class="[
                'day-number text-sm',
                day.isToday
                  ? 'text-blue-600 font-semibold' // 今天日期数字样式
                  : day.isCurrentMonth
                  ? 'text-gray-800' // 当前月份日期数字样式
                  : 'text-gray-400', // 非当前月份日期数字样式
              ]"
            >
              {{ day.dayNumber }}
            </span>
            <!-- 添加农历显示 -->
            <span
              v-if="settingStore.showLunar"
              class="lunar-date text-xs"
              :class="{
                'lunar-month': getLunarDate(new Date(day.date)).month,
              }"
            >
              {{
                getLunarDate(new Date(day.date)).month ||
                getLunarDate(new Date(day.date)).day
              }}
            </span>
          </div>
          <!-- 当天事件列表容器 -->
          <div
            class="day-events mt-1 space-y-1 pb-2 custom-scrollbar flex-grow overflow-auto"
          >
            <!-- MODIFIED: Added flex-grow overflow-auto -->
            <!-- 单个事件项 -->
            <div
              v-for="event in eventStore.getEventsForDay(new Date(day.date))"
              :key="event.id"
              :class="[
                'event-item text-xs p-1 rounded overflow-hidden cursor-pointer',
                event.allDay ? 'all-day-event' : '', // 全天事件特殊类
                event.eventType === 'both' ? 'both-event' : '', // both类型事件特殊类
              ]"
              :style="{
                backgroundColor: event.categoryColor + '33', // 事件背景色，透明度33%
                borderLeft: `3px solid ${event.categoryColor}`, // 事件左边框颜色
              }"
              @click.stop="
                event.eventType === 'both'
                  ? uiStore.openEditTodoModal(event)
                  : uiStore.openEventDetails(event)
              "
              draggable="true"
              @dragstart="uiStore.handleDragStart($event, event)"
            >
              <!-- 事件时间 -->
              <div class="flex items-center">
                <!-- 自定义圆形复选框，仅点击时切换完成状态 -->
                <div
                  v-if="event.eventType === 'both'"
                  class="w-3 h-3 rounded-full border flex items-center justify-center cursor-pointer mr-1"
                  :class="
                    event.completed
                      ? 'bg-indigo-500 border-indigo-600'
                      : 'border-gray-300'
                  "
                  @click.stop="eventStore.toggleTodo(event.id)"
                >
                  <i
                    v-if="event.completed"
                    class="fas fa-check text-white text-[9px]"
                  ></i>
                </div>
                <!-- 时间显示 -->
                <div
                  class="event-time font-medium"
                  :style="{
                    color: event.categoryColor,
                    textDecoration:
                      event.eventType === 'both' && event.completed
                        ? 'line-through'
                        : 'none',
                  }"
                >
                  {{
                    event.allDay
                      ? "All day"
                      : event.eventType === "both"
                      ? formatTime(new Date(event.end), settingStore.hour24)
                      : formatEventTime(event, settingStore.hour24)
                  }}
                </div>
              </div>
              <!-- 事件标题 -->
              <div
                class="event-title font-medium truncate"
                :style="{
                  color: getContrastColor(event.categoryColor),
                  textDecoration:
                    event.eventType === 'both' && event.completed
                      ? 'line-through'
                      : 'none',
                }"
              >
                {{ event.title }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 周视图容器 - 同样修改overflow设置 -->
    <div
      v-else-if="uiStore.currentView === 'week'"
      class="week-view flex-1 overflow-visible p-4"
    >
      <!-- 周视图网格布局 -->
      <div class="grid grid-cols-1 max-h-[1664px]">
        <!-- sticky头部：日期栏+全天事件栏 -->
        <div class="sticky top-0 z-30 shadow-sm">
          <!-- 周视图头部，显示本周7天 -->
          <div class="grid grid-cols-[80px_repeat(7,1fr)]">
            <!-- 左侧空白，用于对齐时间轴 -->
            <div></div>
            <!-- 渲染每一天的表头（星期几和日期） -->
            <div
              v-for="(day, idx) in getWeekDays(
                new Date(uiStore.currentDate),
                settingStore.weekStart
              )"
              :key="idx"
              class="day-header flex flex-col items-center justify-center p-2"
            >
              <div class="text-sm font-medium">{{ day.dayName }}</div>
              <div
                class="text-lg rounded-full w-8 h-8 flex items-center justify-center"
                :class="{ 'bg-blue-600 text-white': day.isToday }"
              >
                {{ day.dayNumber }}
              </div>
            </div>
          </div>
          <!-- 全天事件栏，仅当有全天事件时渲染 -->
          <div
            v-if="
              getWeekDays(
                new Date(uiStore.currentDate),
                settingStore.weekStart
              ).some((day) =>
                eventStore
                  .getEventsForDay(new Date(day.date))
                  .some((e) => e.allDay)
              )
            "
            class="grid grid-cols-[80px_repeat(7,1fr)] h-[48px]"
            style="height: 28px; min-height: 28px; max-height: 28px"
          >
            <div
              class="flex items-center justify-center text-xs font-semibold text-gray-500 h-[28px]"
            >
              全天
            </div>
            <div
              v-for="(day, idx) in getWeekDays(
                new Date(uiStore.currentDate),
                settingStore.weekStart
              )"
              :key="'allday-' + idx"
              class="relative h-full overflow-hidden"
            >
              <template
                v-for="(group, groupIdx) in getEventGroups(
                  eventStore
                    .getEventsForDay(new Date(day.date))
                    .filter((e) => e.allDay)
                )"
                :key="'allday-group-' + groupIdx"
              >
                <div
                  v-for="(event, eventIdx) in group"
                  :key="event.id"
                  class="allday-bar absolute rounded px-2 py-0 truncate cursor-pointer border-l-2"
                  :style="{
                    top: `${groupIdx * 24 + 6}px`,
                    left: `calc(${(100 / group.length) * eventIdx}% + 2px)`,
                    width: `calc(${100 / group.length}% - 4px)`,
                    height: '20px',
                    backgroundColor: event.categoryColor + '22',
                    borderColor: event.categoryColor,
                    color: getContrastColor(event.categoryColor),
                    zIndex: 10 + groupIdx,
                  }"
                  @click.stop="
                    event.eventType === 'both'
                      ? uiStore.openEditTodoModal(event)
                      : uiStore.openEventDetails(event)
                  "
                >
                  <span
                    class="event-title text-sm font-medium truncate"
                    :style="{
                      color: getContrastColor(event.categoryColor),
                    }"
                  >
                    {{ event.title }}
                  </span>
                </div>
              </template>
            </div>
          </div>
        </div>
        <!-- 周视图主体内容，包含时间标签和每天的事件列 -->
        <div class="flex h-full pt-[12px]">
          <!-- pt高度等于sticky头部高度，避免内容被遮挡 -->
          <!-- 左侧时间标签列 -->
          <div class="time-labels border-r border-gray-200 pr-4 w-20">
            <!-- 渲染24小时的时间标签 -->
            <div
              v-for="hour in 24"
              :key="`hour-${hour}-${currentTime.getTime()}`"
              class="time-label h-16 text-xs text-gray-500 text-right -translate-y-3 flex items-start justify-end"
              :class="{ 'opacity-0': uiStore.shouldHideHourLabel(hour - 1) }"
            >
              {{ formatHour(hour - 1, settingStore.hour24) }}
            </div>
          </div>
          <!-- 事件网格区：每一列代表一天 -->
          <div class="flex-1 grid grid-cols-7 relative">
            <!-- 实时时间线 -->
            <div
              v-if="uiStore.currentView === 'week'"
              class="current-time-line absolute left-0 right-0"
              :style="{
                top: `${uiStore.calculateCurrentTimeLine()}px`,
              }"
              :key="currentTime.getTime()"
            >
              <div class="time-text">{{ uiStore.getCurrentTimeText() }}</div>
              <div class="time-line"></div>
            </div>
            <!-- 小时格子背景 -->
            <div v-for="hour in 24" :key="hour" class="contents">
              <div
                v-for="(day, idx) in getWeekDays(
                  new Date(uiStore.currentDate),
                  settingStore.weekStart
                )"
                :key="idx"
                class="hour-cell relative cursor-pointer select-none"
                style="transform: translateY(8px); z-index: 1"
                @click="uiStore.handleHourClick(day.date, hour - 1)"
                @dragover.prevent
              ></div>
            </div>
            <!-- 新增：周视图的每小时横线 -->
            <div
              v-for="h_idx in 24"
              :key="`week-line-${h_idx}`"
              class="absolute left-0 right-0"
              :style="{
                top: `${(h_idx - 1) * 64 + 8}px`, // MODIFIED: Adjusted top calculation
                height: '1px',
                backgroundColor: 'var(--border-color)',
                zIndex: 0, //确保线条在hour-cell背景之上，但在事件之下
              }"
            ></div>
            <!-- 事件渲染区域 -->
            <div
              v-for="(day, idx) in getWeekDays(
                new Date(uiStore.currentDate),
                settingStore.weekStart
              )"
              :key="idx"
              class="absolute left-0 top-0 h-full"
              :style="{
                width: `calc(100% / 7)`,
                left: `calc(${(100 * idx) / 7}% )`,
              }"
              @dragover.prevent
              @drop="uiStore.handleWeekDrop($event, day)"
            >
              <template
                v-for="(group, groupIdx) in getEventGroups(
                  eventStore
                    .getEventsForDay(new Date(day.date))
                    .filter((e) => !e.allDay)
                )"
                :key="groupIdx"
              >
                <!-- 判断分组内是否有重叠（即分组内事件数大于1） -->
                <template v-if="group.length > 1">
                  <!-- 显示+N，样式与事件块一致，背景色取第一个事件 -->
                  <div
                    class="day-event absolute rounded-sm px-2 py-1 overflow-hidden cursor-pointer flex items-center justify-center"
                    :style="{
                      top: `${
                        Math.min(...group.map((e) => calculateEventTop(e))) + 8
                      }px`,
                      height: `${
                        Math.max(
                          ...group.map(
                            (e) =>
                              calculateEventTop(e) + calculateEventHeight(e)
                          )
                        ) -
                          Math.min(...group.map((e) => calculateEventTop(e))) ||
                        64
                      }px`,
                      left: '4px',
                      right: '4px',
                      backgroundColor: group[0].categoryColor + '33',
                      borderLeft: `3px solid ${group[0].categoryColor}`,
                      zIndex: 20,
                      fontSize: '2rem',
                      color: group[0].categoryColor,
                      fontWeight: 'bold',
                    }"
                    @click="
                      uiStore.currentView = 'day';
                      uiStore.currentDate = day.date;
                    "
                  >
                    +{{ group.length }}
                  </div>
                </template>
                <template v-else>
                  <!-- 正常显示不重叠的事件 -->
                  <div
                    v-for="event in group"
                    :key="event.id"
                    :class="[
                      'day-event absolute rounded-sm px-2 py-1 overflow-hidden cursor-pointer',
                      event.eventType === 'both' ? 'both-event-week' : '',
                    ]"
                    :style="{
                      top: `${
                        event.allDay ? 8 : calculateEventTop(event) + 8
                      }px`,
                      height: `${
                        event.allDay ? 1536 : calculateEventHeight(event)
                      }px`,
                      left: '4px',
                      right: '4px',
                      backgroundColor: event.categoryColor + '33',
                      borderLeft: `3px solid ${event.categoryColor}`,
                      zIndex: '10',
                      transform:
                        uiStore.draggedEvent?.id === event.id
                          ? `translateY(${uiStore.calculateDragOffset(event)})`
                          : 'none',
                    }"
                    @click.stop="
                      event.eventType === 'both'
                        ? uiStore.openEditTodoModal(event)
                        : uiStore.openEventDetails(event)
                    "
                    draggable="true"
                    @dragstart="uiStore.handleDragStart($event, event)"
                  >
                    <!-- 添加可拖动的上边框 -->
                    <div
                      v-if="!event.allDay"
                      class="event-resize-handle top-handle"
                      @mousedown.stop="
                        uiStore.handleWeekEventResize($event, event, 'top')
                      "
                      @click.stop
                    ></div>
                    <!-- 添加可拖动的下边框 -->
                    <div
                      v-if="!event.allDay"
                      class="event-resize-handle bottom-handle"
                      @mousedown.stop="
                        uiStore.handleWeekEventResize($event, event, 'bottom')
                      "
                      @click.stop
                    ></div>
                    <div class="flex items-center w-full">
                      <!-- 自定义圆形复选框，仅点击时切换完成状态 -->
                      <div
                        v-if="event.eventType === 'both'"
                        class="w-3 h-3 rounded-full border flex items-center justify-center cursor-pointer mr-1"
                        :class="
                          event.completed
                            ? 'bg-indigo-500 border-indigo-600'
                            : 'border-gray-300'
                        "
                        @click.stop="eventStore.toggleTodo(event.id)"
                      >
                        <i
                          v-if="event.completed"
                          class="fas fa-check text-white text-[9px]"
                        ></i>
                      </div>
                      <div
                        class="event-time text-xs font-medium"
                        :style="{
                          color: event.categoryColor,
                          textDecoration:
                            event.eventType === 'both' && event.completed
                              ? 'line-through'
                              : 'none',
                        }"
                      >
                        {{
                          event.allDay
                            ? "All day"
                            : event.eventType === "both"
                            ? formatTime(
                                new Date(event.end),
                                settingStore.hour24
                              )
                            : formatEventTime(event, settingStore.hour24)
                        }}
                      </div>
                    </div>
                    <div
                      class="event-title text-sm font-medium truncate"
                      :style="{
                        color: getContrastColor(event.categoryColor),
                        textDecoration:
                          event.eventType === 'both' && event.completed
                            ? 'line-through'
                            : 'none',
                      }"
                    >
                      {{ event.title }}
                    </div>
                    <div
                      v-if="event.description"
                      class="event-description text-xs truncate text-gray-600"
                      :style="{
                        textDecoration:
                          event.eventType === 'both' && event.completed
                            ? 'line-through'
                            : 'none',
                      }"
                    >
                      {{ event.description }}
                    </div>
                  </div>
                </template>
              </template>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 日视图容器 - 同样修改overflow设置 -->
    <div
      v-else-if="uiStore.currentView === 'day'"
      class="day-view flex-1 overflow-visible p-4"
    >
      <!-- 日视图网格布局 -->
      <div class="grid grid-cols-1 max-h-[1664px] border border-gray-200">
        <!-- 日视图头部，显示当前日期标题 -->
        <div
          class="day-header text-center p-4 border-b border-gray-200 bg-white"
        >
          <!-- 日视图不再显示今天的时间和日期 -->
          <!-- <div class="text-2xl font-semibold">{{ uiStore.dayViewTitle }}</div> -->
        </div>
        <!-- 新增：全天事件栏，sticky 固定，仅有全天事件时渲染 -->
        <div
          v-if="
            eventStore
              .getEventsForDay(new Date(uiStore.currentDate))
              .some((e) => e.allDay)
          "
          class="sticky top-0 z-30 bg-white border-b border-gray-100"
          style="height: 28px; min-height: 28px; max-height: 28px"
        >
          <div class="flex items-center h-full">
            <div
              class="flex items-center justify-center text-xs font-semibold text-gray-500 h-[28px] w-16 flex-shrink-0"
            >
              全天
            </div>
            <div class="flex-1 relative h-full overflow-hidden">
              <template
                v-for="(group, groupIdx) in getEventGroups(
                  eventStore
                    .getEventsForDay(new Date(uiStore.currentDate))
                    .filter((e) => e.allDay)
                )"
                :key="'allday-group-' + groupIdx"
              >
                <div
                  v-for="(event, eventIdx) in group"
                  :key="event.id"
                  class="allday-bar absolute rounded px-2 py-0 truncate cursor-pointer border-l-2"
                  :style="{
                    top: `${groupIdx * 24 + 6}px`,
                    left: `calc(${(100 / group.length) * eventIdx}% + 2px)`,
                    width: `calc(${100 / group.length}% - 4px)`,
                    height: '20px',
                    backgroundColor: event.categoryColor + '22',
                    borderColor: event.categoryColor,
                    color: getContrastColor(event.categoryColor),
                    zIndex: 10 + groupIdx,
                  }"
                  @click.stop="
                    event.eventType === 'both'
                      ? uiStore.openEditTodoModal(event)
                      : uiStore.openEventDetails(event)
                  "
                >
                  <span
                    class="event-title text-sm font-medium truncate"
                    :style="{
                      color: getContrastColor(event.categoryColor),
                      textDecoration:
                        event.eventType === 'both' && event.completed
                          ? 'line-through'
                          : 'none',
                    }"
                  >
                    {{ event.title }}
                  </span>
                </div>
              </template>
            </div>
          </div>
        </div>
        <!-- 日视图主体内容，包含时间标签和事件列 -->
        <div class="flex h-full pt-[12px]">
          <!-- 左侧时间标签列 -->
          <div class="time-labels border-r border-gray-200 pr-4 w-20">
            <!-- 渲染24小时的时间标签 -->
            <div
              v-for="hour in 24"
              :key="`hour-${hour}-${currentTime.getTime()}`"
              class="time-label h-16 text-xs text-gray-500 text-right -translate-y-3 flex items-start justify-end"
              :class="{ 'opacity-0': uiStore.shouldHideHourLabel(hour - 1) }"
            >
              {{ formatHour(hour - 1, settingStore.hour24) }}
            </div>
          </div>
          <!-- 事件显示列 -->
          <div class="day-column flex-1 relative">
            <!-- 时间轴背景 -->
            <div class="time-axis relative">
              <!-- 整点时间线 -->
              <div
                v-for="hour in 24"
                :key="hour"
                class="time-line absolute left-0 right-0"
                :style="{
                  top: `${(hour - 1) * 64 + 8}px`,
                  height: '1px',
                  backgroundColor: 'var(--border-color)',
                }"
              ></div>
              <!-- 渲染24小时的时间轴 -->
              <div
                v-for="hour in 24"
                :key="hour"
                class="time-slot h-16 relative"
                @click="
                  uiStore.handleHourClick(
                    { date: uiStore.currentDate },
                    hour - 1
                  )
                "
                @dragover.prevent
                @drop="
                  uiStore.handleDayDrop($event, {
                    date: uiStore.currentDate,
                    hour: hour - 1,
                  })
                "
              ></div>
            </div>
            <!-- 事件渲染区域 -->
            <div class="events absolute top-0 left-0 right-0 z-10">
              <!-- 实时时间线 -->
              <div
                v-if="uiStore.currentView === 'day'"
                class="current-time-line absolute left-0 right-0"
                :style="{
                  top: `${uiStore.calculateCurrentTimeLine()}px`,
                }"
                :key="currentTime.getTime()"
              >
                <div class="time-text">{{ uiStore.getCurrentTimeText() }}</div>
                <div class="time-line"></div>
              </div>
              <!-- 日视图事件渲染区域 -->
              <div
                v-for="(group, groupIdx) in getEventGroups(
                  eventStore
                    .getEventsForDay(new Date(uiStore.currentDate))
                    .filter((e) => !e.allDay)
                )"
                :key="groupIdx"
              >
                <div
                  v-for="(event, idx) in group"
                  :key="event.id"
                  :class="[
                    'day-event absolute rounded-sm px-2 py-1 overflow-hidden cursor-pointer',
                    event.eventType === 'both' ? 'both-event-week' : '',
                  ]"
                  :style="{
                    // 对于待办事项，top始终为8px，height为截止时间到0点的高度
                    top:
                      event.eventType === 'both'
                        ? '8px'
                        : `${
                            event.allDay ? 8 : calculateEventTop(event) + 8
                          }px`,
                    height:
                      event.eventType === 'both'
                        ? `${
                            ((new Date(event.end).getHours() * 60 +
                              new Date(event.end).getMinutes()) /
                              60) *
                            64
                          }px`
                        : `${
                            event.allDay ? 1536 : calculateEventHeight(event)
                          }px`,
                    left: `calc(${(100 / group.length) * idx}% + 4px)`,
                    width: `calc(${100 / group.length}% - 8px)`,
                    backgroundColor: event.categoryColor + '33',
                    borderLeft: `3px solid ${event.categoryColor}`,
                    zIndex: '10',
                    transform:
                      uiStore.draggedEvent &&
                      uiStore.draggedEvent.id === event.id
                        ? `translateY(${uiStore.calculateDragOffset(event)})`
                        : 'none',
                    pointerEvents: uiStore.draggedEvent
                      ? uiStore.draggedEvent.id === event.id
                        ? 'auto'
                        : 'none'
                      : 'auto',
                  }"
                  @click.stop="
                    event.eventType === 'both'
                      ? uiStore.openEditTodoModal(event)
                      : uiStore.openEventDetails(event)
                  "
                  draggable="true"
                  @dragstart="uiStore.handleDragStart($event, event)"
                >
                  <!-- 添加可拖动的上边框 -->
                  <div
                    v-if="!event.allDay"
                    class="event-resize-handle top-handle"
                    @mousedown.stop="
                      uiStore.handleDayEventResize($event, event, 'top')
                    "
                    @click.stop
                  ></div>
                  <!-- 添加可拖动的下边框 -->
                  <div
                    v-if="!event.allDay"
                    class="event-resize-handle bottom-handle"
                    @mousedown.stop="
                      uiStore.handleDayEventResize($event, event, 'bottom')
                    "
                    @click.stop
                  ></div>
                  <div class="flex items-center w-full">
                    <!-- 自定义圆形复选框，仅点击时切换完成状态 -->
                    <div
                      v-if="event.eventType === 'both'"
                      class="w-3 h-3 rounded-full border flex items-center justify-center cursor-pointer mr-1"
                      :class="
                        event.completed
                          ? 'bg-indigo-500 border-indigo-600'
                          : 'border-gray-300'
                      "
                      @click.stop="eventStore.toggleTodo(event.id)"
                    >
                      <i
                        v-if="event.completed"
                        class="fas fa-check text-white text-[9px]"
                      ></i>
                    </div>
                    <div
                      class="event-time text-xs font-medium"
                      :style="{
                        color: event.categoryColor,
                        textDecoration:
                          event.eventType === 'both' && event.completed
                            ? 'line-through'
                            : 'none',
                      }"
                    >
                      {{
                        event.eventType === "both"
                          ? formatTime(new Date(event.end), settingStore.hour24)
                          : formatEventTime(event, settingStore.hour24)
                      }}
                    </div>
                  </div>
                  <div
                    class="event-title text-sm font-medium truncate"
                    :style="{
                      color: getContrastColor(event.categoryColor),
                      textDecoration:
                        event.eventType === 'both' && event.completed
                          ? 'line-through'
                          : 'none',
                    }"
                  >
                    {{ event.title }}
                  </div>
                  <div
                    v-if="event.description"
                    class="event-description text-xs truncate text-gray-600"
                    :style="{
                      textDecoration:
                        event.eventType === 'both' && event.completed
                          ? 'line-through'
                          : 'none',
                    }"
                  >
                    {{ event.description }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
/**
 * @file CalendarMain.vue
 * @description 主日历组件，负责展示月、周、日视图以及相关的事件
 */
import { useUiStore } from "@/stores/ui";
import { useEventStore } from "@/stores/event";
import { useSettingStore } from "@/stores/setting";
import {
  formatHour,
  formatTime,
  formatEventTime,
  calculateEventHeight,
  calculateEventTop,
  getContrastColor,
  getEventGroups,
  getLunarDate,
  getMonthDays,
  getWeekDays,
  getWeekDayNames,
} from "@/utils";
import { ref, onMounted, onUnmounted, watch, nextTick } from "vue";

// 使用 Pinia 仓库
const uiStore = useUiStore();
const eventStore = useEventStore();
const settingStore = useSettingStore();

// 用于强制更新时间线
const currentTime = ref(new Date());

// 设置定时器更新当前时间
let timer: number;
onMounted(() => {
  // 立即更新一次
  currentTime.value = new Date();

  timer = window.setInterval(() => {
    currentTime.value = new Date();
  }, 30000); // 每30秒更新一次
});

onUnmounted(() => {
  if (timer) {
    clearInterval(timer);
  }
});

// 监听currentTime的变化
watch(currentTime, () => {
  // 强制更新UI
  nextTick(() => {
    // 触发重新渲染
  });
});
</script>

<style scoped>
/* "今天"日期单元格的特殊样式，顶部有一条蓝色高亮线 */
.today {
  position: relative;
}
.today::after {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background-color: #3b82f6;
}

/* 调整周视图和日视图中的时间标签垂直对齐 */
.week-view .time-label,
.day-view .time-label {
  transform: translateY(8px); /* 替换原来的 -translate-y-3，向下移动时间标签 */
}

/* 为月视图保留紧凑布局 */
.calendar-grid {
  min-height: 800px; /* 确保有足够的高度以便可以滚动 */
  overflow-y: visible;
}

/* 周视图和日视图布局优化 */
.week-view,
.day-view {
  min-height: 600px; /* 确保有足够的高度以便可以滚动 */
  overflow-y: visible;
}

/* 添加日历格子悬停效果 */
.calendar-day {
  transition: all 0.2s ease-in-out;
  border-width: 1px !important;
}

/* 日历格子悬停高亮效果 */
.calendar-day:hover {
  background-color: #f9fafb;
  border-color: #3b82f6 !important;
  box-shadow: 0 0 0 1px rgba(59, 130, 246, 0.3);
  z-index: 5;
}

/* 月视图中的事件悬停效果 */
.event-item {
  transition: all 0.15s ease-in-out;
  position: relative;
  border-left-width: 3px;
}

.event-item:hover {
  transform: translateY(-1px) scale(1.01);
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.12);
  z-index: 15;
}

/* 事件选中效果 - 边框发光 */
.event-item:active {
  transform: translateY(0) scale(1);
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.5);
}

/* 周视图和日视图中的事件悬停效果 */
.day-event {
  transition: all 0.15s ease-in-out;
  border-left-width: 3px;
}

.day-event:hover {
  transform: translateY(-1px);
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.15);
  z-index: 20 !important;
  border-left-width: 4px !important;
}

/* 确保事件悬停时日历格子高亮效果消失 */
.calendar-day:hover .event-item:hover {
  border-color: currentColor;
}

.week-view,
.day-view > div:first-child {
  border: none;
  border-radius: 8px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
  overflow: visible; /* 保持内容溢出可见 */
}

/* 周/日视图小时格子悬停效果 */
.hour-cell {
  transition: background-color 0.15s ease;
  position: relative;
}

.hour-cell:hover {
  background-color: #f0f4ff !important;
}

.hour-cell:hover::after {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border: 1px solid #3b82f6;
  pointer-events: none;
  z-index: 2;
}

/* 优化日历标题显示 */
.calendar-header h2 {
  max-width: 300px; /* 限制最大宽度 */
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 1.25rem; /* 稍微减小字体大小 */
}

/* 确保周视图的标题格式正确 */
.calendar-header {
  padding: 1rem 1.5rem !important; /* 减小内边距，腾出更多空间 */
}

/* 月视图日期格子保持紧凑 */
.calendar-day {
  height: auto !important;
  min-height: 120px;
  max-height: 180px;
  padding-bottom: 8px; /* 增加底部内边距，确保内容可完全滚动 */
}

/* 让日期头部固定在顶部，不随着滚动而消失 */
.calendar-day .day-header {
  background-color: inherit;
  margin-bottom: 4px; /* 增加标题和内容的间距 */
}

/* 确保最后一个事件也有足够的底部空间 */
.day-events .event-item:last-child {
  margin-bottom: 4px;
}

/* 主题颜色变量 */
.calendar-main {
  background-color: var(--bg-primary);
  color: var(--text-primary);
}

.calendar-day {
  background-color: var(--bg-secondary);
  border-color: var(--border-color) !important;
}

.time-label {
  color: var(--text-tertiary);
}

/* 暗黑模式下的日期号优化 */
.dark-mode .day-number {
  color: var(--date-number-color);
  font-weight: 500;
}

/* 当月日期和非当月日期的区分 */
.dark-mode .calendar-day:not(.is-current-month) .day-number {
  color: var(--text-tertiary);
  opacity: 0.7;
}

/* 当前月份的日期格子 */
.dark-mode .calendar-day.is-current-month {
  background-color: var(--calendar-day-bg);
}

/* 暗黑模式下的小时格子悬停样式 */
.dark-mode .hour-cell:hover {
  background-color: var(
    --calendar-day-hover-bg
  ) !important; /* 使用变量控制颜色 */
  border-color: #4a88e5 !important;
}

/* 暗黑模式下事件颜色调整 */
.dark-mode .event-item,
.dark-mode .day-event {
  /* 增加不透明度以提高可见度 */
  opacity: 0.9;
  /* 添加微弱的发光效果增强可见性 */
  box-shadow: 0 1px 5px rgba(255, 255, 255, 0.05);
}

.dark-mode .event-item:hover,
.dark-mode .day-event:hover {
  opacity: 1;
  box-shadow: 0 2px 8px rgba(255, 255, 255, 0.1);
}

/* 事件时间文本在暗黑模式下的调整 */
.dark-mode .event-time {
  font-weight: 600; /* 加粗时间显示 */
}

/* 覆盖日历格子悬停效果 */
.dark-mode .calendar-day:hover {
  background-color: var(
    --calendar-day-hover-bg
  ) !important; /* 使用变量控制颜色 */
  border-color: #4a88e5 !important; /* 使用深蓝色边框 */
  box-shadow: 0 0 0 1px rgba(74, 136, 229, 0.3);
}

/* 高亮边框样式调整 */
.dark-mode .hour-cell:hover::after {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border: 1px solid #4a88e5;
  pointer-events: none;
  z-index: 2;
}

/* 暗黑模式下的事件文本颜色调整 */
.dark-mode .event-title {
  color: var(--event-title-color) !important; /* 使用新变量 */
}

.dark-mode .event-description {
  color: var(--event-description-color) !important; /* 使用新变量 */
}

.dark-mode .event-time {
  color: var(--event-time-color) !important; /* 使用新变量 */
  font-weight: 500; /* 稍微减轻字体粗细 */
}

/* Both类型事件（待办任务）的特殊样式 */
.both-event {
  display: flex;
  flex-direction: column;
}

.both-event.event-item {
  cursor: pointer;
}

/* 已完成待办项的样式 */
.both-event .event-time.line-through,
.both-event .event-title.line-through {
  opacity: 0.7;
}

/* 复选框相关样式 */
.both-event input[type="checkbox"] {
  cursor: pointer;
}

/* 复选框悬停效果 */
.both-event input[type="checkbox"]:hover {
  transform: scale(1.2);
}

/* 周视图中both类型事件的特殊样式 */
.both-event-week {
  display: flex;
  flex-direction: column;
  /* 移除左侧内边距，保持与其他事件一致 */
}

/* 周视图中both事件的line-through样式 */
.both-event-week .event-time.line-through,
.both-event-week .event-title.line-through,
.both-event-week .event-description.line-through {
  opacity: 0.7;
}

/* 农历日期样式 */
.lunar-date {
  display: block;
  margin-top: 2px;
  color: var(--text-tertiary);
  font-size: var(--small-text-font-size);
}

/* 农历月份样式 */
.lunar-month {
  color: #388bfd !important; /* 亮色模式下的蓝色 */
  font-weight: 500;
}

/* 暗黑模式下的农历日期样式 */
.dark-mode .lunar-date {
  color: var(--text-tertiary);
}

.dark-mode .lunar-month {
  color: #58a6ff !important; /* 暗黑模式下的蓝色 */
}

/* 修改字号相关的样式 */
.day-number {
  font-size: var(--base-font-size);
}

.event-title {
  font-size: var(--base-font-size);
}

.event-time {
  font-size: var(--small-text-font-size);
}

.event-description {
  font-size: var(--small-text-font-size);
}

.time-label {
  font-size: var(--small-text-font-size);
}

/* 去除周视图和日视图左侧时间轴与顶部表头的白色边框 */
.week-view .time-labels,
.day-view .time-labels,
.day-view .grid > .day-header {
  border: none !important;
}

.dark-mode .week-view .day-header .text-sm,
.dark-mode .week-view .day-header .text-lg {
  color: var(--text-tertiary) !important;
}

/* 暗黑模式下修正周视图表头背景、文字和底线颜色 */
.dark-mode .week-view .day-header {
  background-color: var(--bg-secondary) !important;
  border-bottom: 1px solid var(--border-color) !important;
}

/* 添加半小时格子的样式 */
.half-hour-cell {
  transition: background-color 0.15s ease;
  position: relative;
}

.half-hour-cell:hover {
  background-color: #f0f4ff !important;
}

.half-hour-cell:hover::after {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border: 1px solid #3b82f6;
  pointer-events: none;
  z-index: 2;
}

/* 暗黑模式下的半小时格子样式 */
.dark-mode .half-hour-cell:hover {
  background-color: var(--calendar-day-hover-bg) !important;
}

.dark-mode .half-hour-cell:hover::after {
  border-color: #4a88e5;
}

.half-hour-cell {
  border-bottom: 1px solid var(--border-color-light) !important;
}

/* 确保事件在半小时格子上方显示 */
.day-event {
  z-index: 10;
}

/* 时间轴样式 */
.time-axis {
  position: relative;
  height: 100%;
}

.time-slot {
  position: relative;
  transition: background-color 0.15s ease;
  height: 64px; /* 确保高度固定 */
}

.time-slot:hover {
  position: relative;
}

.time-slot:hover::before {
  content: "";
  position: absolute;
  top: 8px; /* 与当前整点线对齐 */
  left: 0;
  right: 0;
  bottom: -8px; /* 与下一个整点线对齐 */
  background-color: #f0f4ff;
  z-index: 1;
}

.time-slot:hover::after {
  content: "";
  position: absolute;
  top: 8px; /* 与当前整点线对齐 */
  left: 0;
  right: 0;
  bottom: -8px; /* 与下一个整点线对齐 */
  border: 1px solid #3b82f6;
  pointer-events: none;
  z-index: 2;
}

/* 暗黑模式下的时间轴样式 */
.dark-mode .time-slot:hover::before {
  background-color: var(--calendar-day-hover-bg);
}

.dark-mode .time-slot:hover::after {
  border-color: #4a88e5;
}

/* 添加事件调整大小的手柄样式 */
.event-resize-handle {
  position: absolute;
  left: 0;
  right: 0;
  height: 6px;
  cursor: ns-resize;
  z-index: 20;
}

.event-resize-handle:hover {
  background-color: rgba(59, 130, 246, 0.3);
}

/* 暗黑模式下的调整手柄样式 */
.dark-mode .event-resize-handle:hover {
  background-color: rgba(74, 136, 229, 0.3);
}
.event-resize-handle.top-handle {
  top: 0; /* 上边框 */
}
.event-resize-handle.bottom-handle {
  bottom: 0; /* 下边框 */
}

/* 实时时间线样式 */
.current-time-line {
  pointer-events: none;
  z-index: 30;
}

.current-time-line .time-text {
  position: absolute;
  left: -75px;
  top: -8px;
  width: 60px;
  text-align: right;
  color: #388bfd;
  font-size: calc(var(--small-text-font-size) * 0.9);
  font-weight: 500;
}

.current-time-line .time-line {
  position: absolute;
  left: 0;
  right: 0;
  height: 2px;
  background-color: #388bfd;
  top: 0; /* 确保时间线在容器顶部 */
}

/* 暗黑模式下的时间线样式 */
.dark-mode .current-time-line .time-text {
  color: #58a6ff;
}

.dark-mode .current-time-line .time-line {
  background-color: #58a6ff;
}

/* 时间标签过渡效果 */
.time-label {
  transition: opacity 0.3s ease;
}
</style>
