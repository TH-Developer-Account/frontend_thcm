import React, { type ForwardRefRenderFunction } from "react";
import { AtSign, Send, Smile } from "lucide-react";
import { ExclamationCircleIcon } from "@heroicons/react/24/outline";

import Avatar from "../../common/Avatar";
import Button from "../../common/Button";
import HelperTooltip from "../../common/HelperTooltip";
import TextareaInput from "../../forms/TextareaInput";

import { COMMENT_EMOJIS } from "./comment.constants";
import type { RichTextareaProps } from "./richTextarea.types";
import { useRichInput } from "./useRichInput";

const joinClassNames = (
	...classNames: Array<string | false | null | undefined>
): string => classNames.filter(Boolean).join(" ");

const RichTextarea: ForwardRefRenderFunction<
	HTMLTextAreaElement,
	RichTextareaProps
> = (
	{
		name,
		label,
		placeholder = "Write a comment...",
		value,
		error,
		className = "",
		required,
		disabled,
		helperText,
		isTooltip = true,
		maxLength = 1000,
		autoFocus,
		rows = 1,
		onChange,
		onKeyDown,
		mentionableUsers = [],
		onMentionInsert,
		onFileAttach,
		submitText = "Send",
		submitting = false,
		hasRealContent = false,
		onSubmit,
	},
	forwardedRef,
) => {
	const errorId = error ? `${name}-error` : undefined;
	const internalRef = React.useRef<HTMLTextAreaElement>(null);
	const textareaRef = (forwardedRef ??
		internalRef) as React.RefObject<HTMLTextAreaElement | null>;

	const {
		containerRef,
		popup,
		setPopup,
		mentionOpen,
		filteredMentions,
		handleChange,
		insertAtCursor,
		insertMentionAtCursor,
		insertMention,
	} = useRichInput({
		value,
		textareaRef,
		mentionableUsers,
		onMentionInsert,
		onFileAttach,
		onChange,
	});

	const isSubmitDisabled = !hasRealContent || disabled || submitting;

	return (
		<div className="form-field rich-textarea-field">
			{label ? (
				<div className="form-label-row">
					<label htmlFor={name} className="form-label">
						{label}
						{required ? <span className="form-required"> *</span> : null}
					</label>
					{helperText && isTooltip && !error ? (
						<HelperTooltip label={label} text={helperText} />
					) : null}
				</div>
			) : null}

			<div
				ref={containerRef}
				className={joinClassNames(
					"rich-textarea",
					"rich-textarea-row",
					error && "rich-textarea-error",
					disabled && "rich-textarea-disabled",
				)}
			>
				<div className="rich-textarea-tool-group">
					<Button
						type="button"
						appearance="icon"
						variant="secondary"
						size="sm"
						Icon={Smile}
						aria-label="Insert emoji"
						aria-expanded={popup === "emoji"}
						onClick={() =>
							setPopup((current) => (current === "emoji" ? null : "emoji"))
						}
					/>
					{popup === "emoji" ? (
						<div className="rich-textarea-popover rich-textarea-emoji-popover">
							{COMMENT_EMOJIS.map((emoji) => (
								<Button
									key={emoji}
									type="button"
									className="rich-textarea-emoji"
									onMouseDown={(event) => {
										event.preventDefault();
										insertAtCursor(emoji);
										setPopup(null);
									}}
									aria-label={`Insert ${emoji}`}
								>
									{emoji}
								</Button>
							))}
						</div>
					) : null}
				</div>

				<div className="rich-textarea-input-wrap">
					<TextareaInput
						id={name}
						ref={textareaRef}
						name={name}
						autoFocus={autoFocus}
						placeholder={placeholder}
						value={value}
						disabled={disabled}
						maxLength={maxLength}
						rows={rows}
						aria-invalid={Boolean(error)}
						aria-describedby={errorId}
						onChange={handleChange}
						onKeyDown={(event) => {
							if (event.key === "Escape") setPopup(null);
							onKeyDown?.(event);
						}}
						className={joinClassNames(
							"rich-textarea-control",
							error && "form-input-error",
							disabled && "form-input-disabled",
							className,
						)}
					/>

					{mentionOpen && filteredMentions.length > 0 ? (
						<div
							className="rich-textarea-popover rich-textarea-mention-popover"
							role="listbox"
							aria-label="Mention a user"
						>
							{filteredMentions.map((user) => (
								<button
									key={user.id}
									type="button"
									className="rich-textarea-menu-item"
									onMouseDown={(event) => {
										event.preventDefault();
										insertMention(user);
									}}
									role="option"
									aria-selected="false"
								>
									<Avatar
										firstName={user.first_name}
										lastName={user.last_name}
										size="sm"
									/>
									<span className="rich-textarea-menu-label">
										{user.first_name} {user.last_name}
									</span>
								</button>
							))}
						</div>
					) : null}
				</div>

				<div className="rich-textarea-tool-group">
					<Button
						type="button"
						appearance="standard"
						variant="outline"
						size="sm"
						text="Mention"
						Icon={AtSign}
						aria-label="Mention someone"
						aria-expanded={popup === "mentionList"}
						className="rich-textarea-mention-trigger"
						onClick={() =>
							setPopup((current) =>
								current === "mentionList" ? null : "mentionList",
							)
						}
					/>
					{popup === "mentionList" ? (
						<div
							className="rich-textarea-popover rich-textarea-mention-popover"
							role="listbox"
							aria-label="Mention a user"
						>
							{mentionableUsers.length > 0 ? (
								mentionableUsers.map((user) => (
									<button
										key={user.id}
										type="button"
										className="rich-textarea-menu-item"
										onMouseDown={(event) => {
											event.preventDefault();
											insertMentionAtCursor(user);
											setPopup(null);
										}}
										role="option"
										aria-selected="false"
									>
										<Avatar
											firstName={user.first_name}
											lastName={user.last_name}
											size="sm"
										/>
										<span className="rich-textarea-menu-label">
											{user.first_name} {user.last_name}
										</span>
									</button>
								))
							) : (
								<div className="rich-textarea-menu-item" aria-disabled="true">
									<span className="rich-textarea-menu-label">
										No users to mention
									</span>
								</div>
							)}
						</div>
					) : null}
				</div>

				<Button
					type="button"
					appearance="standard"
					variant="brand"
					size="sm"
					Icon={Send}
					text={submitting ? "Saving..." : submitText}
					disabled={isSubmitDisabled}
					loading={submitting}
					onClick={onSubmit}
					className="rich-textarea-submit"
				/>

				{error ? (
					<ExclamationCircleIcon
						className="form-error-icon"
						aria-hidden="true"
					/>
				) : null}
			</div>

			{error ? (
				<p id={errorId} className="form-error-text">
					{error}
				</p>
			) : null}

			<span className="rich-textarea-counter">
				{value.length} / {maxLength}
			</span>
		</div>
	);
};

const RichTextareaInput = React.forwardRef(RichTextarea);
RichTextareaInput.displayName = "RichTextareaInput";

export default RichTextareaInput;
