import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { IconClose } from '@/components/common/Icons';
import { cn } from '@/lib/cn';

interface HelpGuideProps {
  open: boolean;
  onClose: () => void;
}

interface Section {
  title: string;
  content: string[];
}

const SECTIONS: Section[] = [
  {
    title: '基本流程',
    content: [
      '点击「生成打乱」获取随机打乱公式，也可手动编辑。',
      '点击解法链中的步骤节点使其激活（蓝色高亮），然后通过虚拟键盘输入转动公式。',
      '分支末端实时显示编译后的最终解法与步数。',
      '点击右上角设置按钮可导入/导出会话数据。',
    ],
  },
  {
    title: '虚拟键盘',
    content: [
      '点击单个面转动键（如 R），连续点击会自动轮替：R → R2 → R\' → 清空 → R …',
      '长按按键可弹出变体选择面板。',
      '底部工具行提供修饰键：2（双转）、\'（逆时针）、w（宽转）——点击修饰键会修改当前步骤最后一个转动。',
      '括号 ( ) 用于标记需要反向的步骤段，编译时自动逆序并求逆。',
      '在键盘配置中可调整位置（底部/左侧/右侧/悬浮）、增减行、重排顺序。',
    ],
  },
  {
    title: '解法链与分支',
    content: [
      '解法链呈树状结构：每个节点可以有子步骤（子分支），也可以有并列的兄弟分支。',
      '点击节点上的「子步骤」按钮可在当前步骤下添加子节点（表示后续步骤的不同选择）。',
      '点击「分支」按钮可在当前步骤旁添加兄弟节点（表示同一位置的替代方案）。',
      '点击「影子」按钮可生成影子分支——仅翻转最后一个转动（如 R → R\'），用于快速探索。',
      '删除节点时，焦点自动转移到相邻节点。',
    ],
  },
  {
    title: '步骤标签与注释',
    content: [
      '点击步骤左侧的标签（如「未命名」）可编辑步骤名，用于标记阶段（如 EO、DR）。',
      '双击转动公式文本可直接编辑原始公式。',
      '点击「注释」按钮可添加/编辑注释内容，导出时注释以 // 形式保留。',
    ],
  },
  {
    title: '括号与反向',
    content: [
      '点击括号图标可将整段步骤标记为反向——编译时该段会被逆序、求逆后拼入最终公式。',
      '也可以在公式中使用内联括号（如 (R U R\' U\')），编译时自动处理。',
      '括号反向和影子分支可组合使用，灵活探索不同解法。',
    ],
  },
  {
    title: '插入公式',
    content: [
      '插入功能用于在解法中预留占位符（如 #），后续统一填入替换内容。',
      '点击键盘上的「#插入」按钮，首次使用会自动创建 # 占位符。',
      '之后再次点击会弹出选择面板，可选择已有占位符或新建。',
      '插入公式支持普通替换、宽转动修饰、交换子展开三种模式。',
    ],
  },
  {
    title: '计时器',
    content: [
      '默认 60 分钟正计时，点击 ▶ 开始，⏸ 暂停。',
      '剩余 15 分钟变为琥珀色预警，5 分钟变为红色警告。',
      '超时后仍可继续编辑解法，不影响数据。',
    ],
  },
  {
    title: '整理与导出',
    content: [
      '侧边抽屉中的「整理板」提供独立文本编辑区，可从任意分支一键导入编译结果。',
      '设置中可导出当前会话为 JSON 文件，也可导入之前导出的文件进行恢复。',
      '智能消步：同面及同轴对面（U/D、F/B、L/R）的连续转动会自动模 4 合并。',
    ],
  },
];

export function HelpGuide({ open, onClose }: HelpGuideProps) {
  const [openSections, setOpenSections] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (open) setOpenSections(new Set(SECTIONS.map((s) => s.title)));
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const toggleSection = (title: string) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(title)) next.delete(title);
      else next.add(title);
      return next;
    });
  };

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="card w-full max-w-lg max-h-[85vh] overflow-auto p-4 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="help-title"
      >
        <div className="mb-3 flex items-center justify-between">
          <h2
            id="help-title"
            className="text-base font-semibold text-primary-700"
          >
            使用指南
          </h2>
          <button
            type="button"
            className="btn btn-ghost btn-icon"
            onClick={onClose}
            aria-label="关闭"
          >
            <IconClose size={16} />
          </button>
        </div>

        <div className="flex flex-col gap-1">
          {SECTIONS.map((section) => {
            const isOpen = openSections.has(section.title);
            return (
              <details
                key={section.title}
                open={isOpen}
                onToggle={(e) => {
                  if ((e.target as HTMLDetailsElement).open !== isOpen) {
                    toggleSection(section.title);
                  }
                }}
                className="rounded-lg border border-primary-100 bg-white"
              >
                <summary className="flex cursor-pointer items-center justify-between px-3 py-2 text-sm font-medium text-primary-700 hover:bg-primary-50 rounded-lg">
                  <span>{section.title}</span>
                  <span
                    className={cn(
                      'ml-2 text-xs text-slate-400 transition-transform',
                      isOpen && 'rotate-180',
                    )}
                  >
                    ▾
                  </span>
                </summary>
                <ul className="px-3 pb-2 space-y-1.5">
                  {section.content.map((line, i) => (
                    <li
                      key={i}
                      className="text-xs leading-relaxed text-slate-600 pl-3 -indent-3"
                    >
                      • {line}
                    </li>
                  ))}
                </ul>
              </details>
            );
          })}
        </div>
      </div>
    </div>,
    document.body,
  );
}
