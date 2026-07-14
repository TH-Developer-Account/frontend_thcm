import React, { type ForwardRefRenderFunction } from "react";
import { ChevronUp, Send, Smile, Type } from "lucide-react";
import { ExclamationCircleIcon } from "@heroicons/react/24/outline";

import Avatar from "../../../../../components/common/Avatar";
import Button from "../../../../../components/common/Button";
import HelperTooltip from "../../../../../components/common/HelperTooltip";
import TextareaInput from "../../../../../components/forms/TextareaInput";

import { useRichInput } from "../../hooks/useRichInput";
import { EMOJIS, FORMAT_ACTIONS } from "../../utils/constants";
import type { RichTextareaProps } from "../../types/workflow.types";

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
		rows = 2,
		onChange,
		onKeyDown,
		mentionableUsers = [],
		onMentionInsert,
		onFileAttach,
		submitText = "Send",
		submitting = false,
		hasRealContent = false,
		onSubmit,
		menuItems = [],
		onMenuAction,
	},
	ref,
) => {
	const errorId = name ? `${name}-error` : undefined;

	const internalRef = React.useRef<HTMLTextAreaElement>(null);

	const textareaRef = (ref ??
		internalRef) as React.RefObject<HTMLTextAreaElement>;

	const {
		containerRef,
		popup,
		setPopup,
		mentionOpen,
		filteredMentions,
		handleChange,
		insertAtCursor,
		insertMention,
		applyFormat,
	} = useRichInput({
		value,
		taRef: textareaRef,
		mentionableUsers,
		onMentionInsert,
		onFileAttach,
		onChange,
	});

	const isSubmitDisabled = !hasRealContent || disabled || submitting;

	const handleMenuItemClick = (action: string) => {
		if (action === "mention") {
			insertAtCursor("@");
		} else {
			onMenuAction?.(action);
		}

		setPopup(null);
	};

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
					error && "rich-textarea-error",
					disabled && "rich-textarea-disabled",
				)}
			>
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
					aria-describedby={error ? errorId : undefined}
					onChange={handleChange}
					onKeyDown={(event) => {
						if (event.key === "Escape") {
							setPopup(null);
						}

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

				<div className="rich-textarea-toolbar">
					<div className="rich-textarea-toolbar-start">
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
									{EMOJIS.map((emoji) => (
										<button
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
										</button>
									))}
								</div>
							) : null}
						</div>

						<span className="rich-textarea-divider" aria-hidden="true" />

						<div className="rich-textarea-tool-group">
							<Button
								type="button"
								appearance="icon"
								variant="secondary"
								size="sm"
								Icon={Type}
								aria-label="Formatting options"
								aria-expanded={popup === "format"}
								onClick={() =>
									setPopup((current) =>
										current === "format" ? null : "format",
									)
								}
							/>

							{popup === "format" ? (
								<div className="rich-textarea-popover rich-textarea-format-popover">
									{FORMAT_ACTIONS.map(({ icon: Icon, fmt, title }) => (
										<Button
											key={fmt}
											type="button"
											appearance="icon"
											variant="secondary"
											size="sm"
											Icon={Icon}
											aria-label={title}
											onMouseDown={(event) => {
												event.preventDefault();
												applyFormat(fmt);
											}}
										/>
									))}
								</div>
							) : null}
						</div>
					</div>

					<div className="rich-textarea-toolbar-end">
						<span className="rich-textarea-counter">
							{(value ?? "").length} / {maxLength}
						</span>

						{onSubmit || menuItems.length > 0 ? (
							<div className="rich-textarea-submit-group">
								{onSubmit ? (
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
								) : null}

								{menuItems.length > 0 ? (
									<Button
										type="button"
										appearance="icon"
										variant="brand"
										size="sm"
										Icon={ChevronUp}
										aria-label="More comment options"
										aria-expanded={popup === "menu"}
										aria-haspopup="menu"
										active={popup === "menu"}
										onClick={() =>
											setPopup((current) =>
												current === "menu" ? null : "menu",
											)
										}
										className={joinClassNames(
											"rich-textarea-menu-trigger",
											popup === "menu" && "rich-textarea-menu-trigger-open",
										)}
									/>
								) : null}

								{popup === "menu" && menuItems.length > 0 ? (
									<div
										className="rich-textarea-popover rich-textarea-action-popover"
										role="menu"
									>
										{menuItems.map(({ icon: Icon, label, action }) => (
											<button
												key={action}
												type="button"
												className="rich-textarea-menu-item"
												onClick={() => handleMenuItemClick(action)}
												role="menuitem"
											>
												<Icon size={14} aria-hidden="true" />

												<span className="rich-textarea-menu-label">
													{label}
												</span>
											</button>
										))}
									</div>
								) : null}
							</div>
						) : null}
					</div>
				</div>

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
		</div>
	);
};

const RichTextareaInput = React.forwardRef(RichTextarea);

RichTextareaInput.displayName = "RichTextareaInput";

export default RichTextareaInput;
