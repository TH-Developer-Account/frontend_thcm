import { AtSign, Bold, Code, Italic, List, MessageCircle } from "lucide-react";

import type { CommentMenuAction } from "./comment.types";
import type { FormatType } from "./richTextarea.types";

export const COMMENT_MENU_ITEMS: CommentMenuAction[] = [
	{ icon: AtSign, label: "Mention someone", action: "mention" },
	{ icon: MessageCircle, label: "Send comment", action: "submit" },
];

export const COMMENT_EMOJIS = [
	"👍", "❤️", "😊", "🎉", "✅", "🔥", "👏", "💡", "⚠️", "📎",
	"📋", "🔍", "💬", "📌", "🚀", "⭐", "✨", "🙏", "👀", "💯",
	"🤔", "😅", "🙌", "📊", "📝", "🔗", "✔️", "❌", "⏰", "📅",
];

export const COMMENT_FORMAT_ACTIONS = [
	{ icon: Bold, fmt: "bold", title: "Bold" },
	{ icon: Italic, fmt: "italic", title: "Italic" },
	{ icon: Code, fmt: "code", title: "Inline code" },
	{ icon: List, fmt: "bullet", title: "Bullet list" },
] satisfies Array<{ icon: React.ElementType; fmt: FormatType; title: string }>;

export const FORMAT_WRAP: Record<FormatType, (selection: string) => string> = {
	bold: (selection) => (selection ? `**${selection}**` : "****"),
	italic: (selection) => (selection ? `_${selection}_` : "__"),
	code: (selection) => (selection ? `\`${selection}\`` : "``"),
	bullet: (selection) => `\n- ${selection || ""}`,
};

export const FORMAT_CURSOR_OFFSET: Record<FormatType, number> = {
	bold: 2,
	italic: 1,
	code: 1,
	bullet: 3,
};
