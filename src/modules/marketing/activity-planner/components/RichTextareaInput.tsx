import React, { type ForwardRefRenderFunction } from "react";
import {
  Smile,
  //   Paperclip,
  AtSign,
  Type,
  Send,
  ChevronUp,
  Lock,
} from "lucide-react";
import { ExclamationCircleIcon } from "@heroicons/react/24/outline";
import { useRichInput } from "../hooks/useRichInput";
import { EMOJIS, FORMAT_ACTIONS } from "../utils/constants";
import type { RichTextareaProps } from "../types/workflow.types";
import TextareaInput from "../../../../components/FormElements/TextareaInput";
import HelperTooltip from "../../../../components/common/HelperTooltip";
import Avatar from "../../../../components/common/Avatar";

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
    rows = 3,
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
    canApprove,
    canClarify,
    onApprove,
    onClarify,
  },
  ref,
) => {
  const errorId = name ? `${name}-error` : undefined;
  const internalRef = React.useRef<HTMLTextAreaElement>(null);
  const taRef = (ref ?? internalRef) as React.RefObject<HTMLTextAreaElement>;

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
    // handleAttach,
  } = useRichInput({
    value,
    taRef,
    mentionableUsers,
    onMentionInsert,
    onFileAttach,
    onChange,
  });

  return (
    <div className="form-field">
      {label && (
        <div className="form-label-row">
          <label htmlFor={name} className="form-label">
            {label}
            {required && <span className="form-required"> *</span>}
          </label>
          {helperText && isTooltip && !error && (
            <HelperTooltip label={label ?? ""} text={helperText} />
          )}
        </div>
      )}

      <div
        ref={containerRef}
        className={`
					form-input-wrapper relative flex flex-col rounded-xl border border-zinc-200 bg-white
					focus-within:border-zinc-400 focus-within:ring-2 focus-within:ring-zinc-100 transition-all
					${error ? "border-red-400" : ""}
					${disabled ? "opacity-60 pointer-events-none" : ""}
				`}
      >
        <TextareaInput
          id={name}
          ref={taRef}
          name={name}
          autoFocus={autoFocus}
          placeholder={placeholder}
          value={value}
          disabled={disabled}
          maxLength={maxLength}
          rows={rows}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : undefined}
          onChange={handleChange}
          onKeyDown={(e) => {
            if (e.key === "Escape") setPopup(null);
            onKeyDown?.(e);
          }}
          className={`
						w-full resize-none rounded-t-xl bg-transparent px-3.5 pt-3 pb-1.5
						text-sm text-zinc-900 placeholder-zinc-400 outline-none focus:ring-0
						border-none min-h-[70px] max-h-[180px] overflow-y-auto
						${error ? "form-input-error" : ""}
						${disabled ? "form-input-disabled" : ""}
						${className}
					`}
        />

        {/* MENTION PICKER */}
        {mentionOpen && filteredMentions.length > 0 && (
          <div className="absolute bottom-full left-0 z-50 mb-1 w-56 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-lg">
            {filteredMentions.map((user) => (
              <button
                key={user.id}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  insertMention(user);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-zinc-50"
              >
                <Avatar
                  firstName={user.first_name}
                  lastName={user.last_name}
                  size="sm"
                />
                <span>
                  {user.first_name} {user.last_name}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* TOOLBAR */}
        <div className="flex items-center px-2 pb-2 pt-1 gap-2 border-t border-t-zinc-200">
          {/* LEFT */}
          <div className="flex flex-1 items-center gap-0.5">
            {/* EMOJI */}
            <div className="relative">
              <button
                type="button"
                title="Emoji"
                onClick={() =>
                  setPopup((p) => (p === "emoji" ? null : "emoji"))
                }
                className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition-colors"
              >
                <Smile size={15} />
              </button>
              {popup === "emoji" && (
                <div className="absolute bottom-full left-0 z-50 mb-1 grid grid-cols-8 gap-0.5 rounded-xl border border-zinc-200 bg-white p-2 shadow-lg w-[220px]">
                  {EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        insertAtCursor(emoji);
                        setPopup(null);
                      }}
                      className="flex h-7 w-7 items-center justify-center rounded-md text-base hover:bg-zinc-100 transition-colors"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* ATTACH */}
            {/* <button
							type="button"
							title="Attach file"
							onClick={handleAttach}
							className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition-colors"
						>
							<Paperclip size={15} />
						</button> */}

            {/* MENTION */}
            <button
              type="button"
              title="Mention someone"
              onClick={() => {
                insertAtCursor("@");
              }}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition-colors"
            >
              <AtSign size={15} />
            </button>

            <div className="mx-1 h-4 w-px bg-zinc-200" />

            {/* FORMAT */}
            <div className="relative">
              <button
                type="button"
                title="Formatting"
                onClick={() =>
                  setPopup((p) => (p === "format" ? null : "format"))
                }
                className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition-colors"
              >
                <Type size={15} />
              </button>
              {popup === "format" && (
                <div className="absolute bottom-full left-0 z-50 mb-1 flex items-center gap-0.5 rounded-xl border border-zinc-200 bg-white p-1.5 shadow-lg">
                  {FORMAT_ACTIONS.map(({ icon: Icon, fmt, title }) => (
                    <button
                      key={fmt}
                      type="button"
                      title={title}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        applyFormat(fmt);
                      }}
                      className="flex h-7 w-7 items-center justify-center rounded-md text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 transition-colors"
                    >
                      <Icon size={14} />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-zinc-400 tabular-nums">
              {(value ?? "").length} / {maxLength}
            </span>

            {/* SPLIT BUTTON */}
            {(onSubmit || menuItems.length > 0) && (
              <div className="relative">
                <div
                  className="flex items-stretch rounded-lg overflow-hidden"
                  style={{ background: "#E85D2F" }}
                >
                  {onSubmit && (
                    <button
                      type="button"
                      disabled={!hasRealContent || disabled || submitting}
                      onClick={onSubmit}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white transition-opacity disabled:opacity-50 disabled:cursor-not-allowed hover:enabled:brightness-110"
                    >
                      <Send size={11} />
                      {submitting ? "Saving..." : submitText}
                    </button>
                  )}

                  {onSubmit && menuItems.length > 0 && (
                    <div className="w-px self-stretch bg-white/30" />
                  )}

                  {menuItems.length > 0 && (
                    <button
                      type="button"
                      aria-label="More options"
                      aria-expanded={popup === "menu"}
                      aria-haspopup="menu"
                      onClick={() =>
                        setPopup((p) => (p === "menu" ? null : "menu"))
                      }
                      className={`flex items-center justify-center px-2 text-white hover:enabled:brightness-110 transition-all ${popup === "menu" ? "rotate-180" : ""}`}
                    >
                      <ChevronUp size={13} />
                    </button>
                  )}
                </div>

                {popup === "menu" && (
                  <div className="absolute bottom-full right-0 z-50 mb-1 w-52 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-lg">
                    {menuItems.length > 0 && (
                      <div className="border-b border-zinc-100 py-1">
                        {menuItems.map(({ icon: Icon, label, action }) => (
                          <button
                            key={action}
                            type="button"
                            onClick={() => {
                              if (action === "mention") {
                                insertAtCursor("@");
                              } else {
                                onMenuAction?.(action);
                              }
                              setPopup(null);
                            }}
                            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-zinc-50"
                          >
                            <Icon size={14} className="text-zinc-400" />
                            {label}
                          </button>
                        ))}
                      </div>
                    )}
                    <div className="py-1">
                      <button
                        type="button"
                        disabled={!canApprove}
                        onClick={() => {
                          onApprove?.();
                          setPopup(null);
                        }}
                        className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm ${canApprove ? "text-zinc-900 hover:bg-zinc-50" : "cursor-not-allowed text-zinc-300"}`}
                      >
                        Approve
                        {!canApprove && (
                          <Lock size={12} className="text-zinc-300" />
                        )}
                      </button>
                      <button
                        type="button"
                        disabled={!canClarify}
                        onClick={() => {
                          onClarify?.();
                          setPopup(null);
                        }}
                        className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm ${canClarify ? "text-zinc-900 hover:bg-zinc-50" : "cursor-not-allowed text-zinc-300"}`}
                      >
                        Clarify
                        {!canClarify && (
                          <Lock size={12} className="text-zinc-300" />
                        )}
                      </button>
                      <button
                        type="button"
                        disabled={!canClarify}
                        onClick={() => {
                          onClarify?.();
                          setPopup(null);
                        }}
                        className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm ${canClarify ? "text-zinc-900 hover:bg-zinc-50" : "cursor-not-allowed text-zinc-300"}`}
                      >
                        Reject
                        {!canClarify && (
                          <Lock size={12} className="text-zinc-300" />
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {error && <ExclamationCircleIcon className="form-error-icon" />}
      </div>

      {error && (
        <p id={errorId} className="form-error-text">
          {error}
        </p>
      )}
    </div>
  );
};

const RichTextareaInput = React.forwardRef(RichTextarea);
RichTextareaInput.displayName = "RichTextareaInput";

export default RichTextareaInput;
