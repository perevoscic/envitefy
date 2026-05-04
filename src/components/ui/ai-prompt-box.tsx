"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowUp,
  BrainCog,
  FolderCode,
  Globe,
  Mic,
  Paperclip,
  Square,
  StopCircle,
  X,
} from "lucide-react";
import React from "react";

export const cn = (...classes: Array<string | undefined | null | false>) =>
  classes.filter(Boolean).join(" ");

const PROMPT_BOX_STYLE_ID = "envitefy-ai-prompt-box-styles";

const promptBoxStyles = `
  .envitefy-ai-prompt-box *:focus-visible {
    outline-offset: 0 !important;
    --ring-offset: 0 !important;
  }
  .envitefy-ai-prompt-box textarea::-webkit-scrollbar {
    width: 6px;
  }
  .envitefy-ai-prompt-box textarea::-webkit-scrollbar-track {
    background: transparent;
  }
  .envitefy-ai-prompt-box textarea::-webkit-scrollbar-thumb {
    background-color: #444444;
    border-radius: 3px;
  }
  .envitefy-ai-prompt-box textarea::-webkit-scrollbar-thumb:hover {
    background-color: #555555;
  }
`;

function usePromptBoxStyles() {
  React.useEffect(() => {
    if (typeof document === "undefined" || document.getElementById(PROMPT_BOX_STYLE_ID)) return;
    const styleSheet = document.createElement("style");
    styleSheet.id = PROMPT_BOX_STYLE_ID;
    styleSheet.innerText = promptBoxStyles;
    document.head.appendChild(styleSheet);
  }, []);
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  className?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => (
    <textarea
      className={cn(
        "flex min-h-[44px] w-full resize-none overflow-y-auto rounded-md border-none bg-transparent px-3 py-2.5 text-base text-gray-100 placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-0 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      ref={ref}
      rows={1}
      {...props}
    />
  ),
);
Textarea.displayName = "Textarea";

const TooltipProvider = TooltipPrimitive.Provider;
const Tooltip = TooltipPrimitive.Root;
const TooltipTrigger = TooltipPrimitive.Trigger;

export const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <TooltipPrimitive.Content
    ref={ref}
    sideOffset={sideOffset}
    className={cn(
      "z-50 overflow-hidden rounded-md border border-[#333333] bg-[#1F2023] px-3 py-1.5 text-sm text-white shadow-md",
      className,
    )}
    {...props}
  />
));
TooltipContent.displayName = TooltipPrimitive.Content.displayName;

const Dialog = DialogPrimitive.Root;
const DialogPortal = DialogPrimitive.Portal;

export const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn("fixed inset-0 z-50 bg-black/60 backdrop-blur-sm", className)}
    {...props}
  />
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

export const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-[50%] top-[50%] z-50 grid w-full max-w-[90vw] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-2xl border border-[#333333] bg-[#1F2023] p-0 shadow-xl duration-300 md:max-w-[800px]",
        className,
      )}
      {...props}
    >
      {children}
      <DialogPrimitive.Close className="absolute right-4 top-4 z-10 rounded-full bg-[#2E3033]/80 p-2 transition-all hover:bg-[#2E3033]">
        <X className="h-5 w-5 text-gray-200 hover:text-white" aria-hidden="true" />
        <span className="sr-only">Close</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPortal>
));
DialogContent.displayName = DialogPrimitive.Content.displayName;

export const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn("text-lg font-semibold leading-none tracking-tight text-gray-100", className)}
    {...props}
  />
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", type = "button", ...props }, ref) => {
    const variantClasses = {
      default: "bg-white text-black hover:bg-white/80",
      outline: "border border-[#444444] bg-transparent hover:bg-[#3A3A40]",
      ghost: "bg-transparent hover:bg-[#3A3A40]",
    };
    const sizeClasses = {
      default: "h-10 px-4 py-2",
      sm: "h-8 px-3 text-sm",
      lg: "h-12 px-6",
      icon: "h-8 w-8 rounded-full aspect-[1/1]",
    };
    return (
      <button
        className={cn(
          "inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50",
          variantClasses[variant],
          sizeClasses[size],
          className,
        )}
        ref={ref}
        type={type}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

interface VoiceRecorderProps {
  isRecording: boolean;
  onStartRecording: () => void;
  onStopRecording: (duration: number) => void;
  visualizerBars?: number;
}

const VoiceRecorder: React.FC<VoiceRecorderProps> = ({
  isRecording,
  onStartRecording,
  onStopRecording,
  visualizerBars = 32,
}) => {
  const [time, setTime] = React.useState(0);
  const timerRef = React.useRef<ReturnType<typeof setInterval> | null>(null);
  const elapsedRef = React.useRef(0);
  const wasRecordingRef = React.useRef(false);
  const bars = React.useMemo(
    () =>
      Array.from({ length: visualizerBars }, (_, index) => ({
        height: `${22 + ((index * 37) % 68)}%`,
        delay: `${index * 0.05}s`,
        duration: `${0.55 + (index % 5) * 0.08}s`,
      })),
    [visualizerBars],
  );

  React.useEffect(() => {
    elapsedRef.current = time;
  }, [time]);

  React.useEffect(() => {
    if (!isRecording) return;
    onStartRecording();
    setTime(0);
    elapsedRef.current = 0;
    timerRef.current = setInterval(() => setTime((current) => current + 1), 1000);
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isRecording, onStartRecording]);

  React.useEffect(() => {
    if (wasRecordingRef.current && !isRecording) {
      onStopRecording(elapsedRef.current);
      setTime(0);
    }
    wasRecordingRef.current = isRecording;
  }, [isRecording, onStopRecording]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div
      className={cn(
        "flex w-full flex-col items-center justify-center py-3 transition-all duration-300",
        isRecording ? "opacity-100" : "h-0 overflow-hidden py-0 opacity-0",
      )}
    >
      <div className="mb-3 flex items-center gap-2">
        <div className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
        <span className="font-mono text-sm text-white/80">{formatTime(time)}</span>
      </div>
      <div className="flex h-10 w-full items-center justify-center gap-0.5 px-4">
        {bars.map((bar, index) => (
          <div
            key={index}
            className="w-0.5 animate-pulse rounded-full bg-white/50"
            style={{
              height: bar.height,
              animationDelay: bar.delay,
              animationDuration: bar.duration,
            }}
          />
        ))}
      </div>
    </div>
  );
};

interface ImageViewDialogProps {
  imageUrl: string | null;
  onClose: () => void;
}

const ImageViewDialog: React.FC<ImageViewDialogProps> = ({ imageUrl, onClose }) => {
  if (!imageUrl) return null;
  return (
    <Dialog open={Boolean(imageUrl)} onOpenChange={onClose}>
      <DialogContent className="border-none bg-transparent p-0 shadow-none md:max-w-[800px]">
        <DialogTitle className="sr-only">Image Preview</DialogTitle>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="relative overflow-hidden rounded-2xl bg-[#1F2023] shadow-2xl"
        >
          <img
            src={imageUrl}
            alt="Full preview"
            className="max-h-[80vh] w-full rounded-2xl object-contain"
          />
        </motion.div>
      </DialogContent>
    </Dialog>
  );
};

interface PromptInputContextType {
  isLoading: boolean;
  value: string;
  setValue: (value: string) => void;
  maxHeight: number | string;
  onSubmit?: () => void;
  disabled?: boolean;
}

const PromptInputContext = React.createContext<PromptInputContextType | null>(null);

function usePromptInput() {
  const context = React.useContext(PromptInputContext);
  if (!context) throw new Error("usePromptInput must be used within a PromptInput");
  return context;
}

interface PromptInputProps {
  isLoading?: boolean;
  value?: string;
  onValueChange?: (value: string) => void;
  maxHeight?: number | string;
  onSubmit?: () => void;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  onDragOver?: (event: React.DragEvent<HTMLDivElement>) => void;
  onDragLeave?: (event: React.DragEvent<HTMLDivElement>) => void;
  onDrop?: (event: React.DragEvent<HTMLDivElement>) => void;
}

export const PromptInput = React.forwardRef<HTMLDivElement, PromptInputProps>(
  (
    {
      className,
      isLoading = false,
      maxHeight = 240,
      value,
      onValueChange,
      onSubmit,
      children,
      disabled = false,
      onDragOver,
      onDragLeave,
      onDrop,
    },
    ref,
  ) => {
    usePromptBoxStyles();
    const [internalValue, setInternalValue] = React.useState(value || "");
    const isControlled = value !== undefined;
    const currentValue = isControlled ? value : internalValue;
    const handleChange = (newValue: string) => {
      if (!isControlled) setInternalValue(newValue);
      onValueChange?.(newValue);
    };

    return (
      <TooltipProvider>
        <PromptInputContext.Provider
          value={{
            isLoading,
            value: currentValue,
            setValue: handleChange,
            maxHeight,
            onSubmit,
            disabled,
          }}
        >
          <div
            ref={ref}
            className={cn(
              "envitefy-ai-prompt-box rounded-3xl border border-[#444444] bg-[#1F2023] p-2 shadow-[0_8px_30px_rgba(0,0,0,0.24)] transition-all duration-300",
              isLoading && "border-red-500/70",
              className,
            )}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
          >
            {children}
          </div>
        </PromptInputContext.Provider>
      </TooltipProvider>
    );
  },
);
PromptInput.displayName = "PromptInput";

export interface PromptInputTextareaProps extends React.ComponentPropsWithoutRef<typeof Textarea> {
  disableAutosize?: boolean;
}

export const PromptInputTextarea: React.FC<PromptInputTextareaProps> = ({
  className,
  onKeyDown,
  disableAutosize = false,
  placeholder,
  ...props
}) => {
  const { value, setValue, maxHeight, onSubmit, disabled } = usePromptInput();
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  React.useEffect(() => {
    if (disableAutosize || !textareaRef.current) return;
    textareaRef.current.style.height = "auto";
    textareaRef.current.style.height =
      typeof maxHeight === "number"
        ? `${Math.min(textareaRef.current.scrollHeight, maxHeight)}px`
        : `min(${textareaRef.current.scrollHeight}px, ${maxHeight})`;
  }, [value, maxHeight, disableAutosize]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      onSubmit?.();
    }
    onKeyDown?.(event);
  };

  return (
    <Textarea
      ref={textareaRef}
      value={value}
      onChange={(event) => setValue(event.target.value)}
      onKeyDown={handleKeyDown}
      className={cn("text-base", className)}
      disabled={disabled}
      placeholder={placeholder}
      {...props}
    />
  );
};

export type PromptInputActionsProps = React.HTMLAttributes<HTMLDivElement>;

export const PromptInputActions: React.FC<PromptInputActionsProps> = ({
  children,
  className,
  ...props
}) => (
  <div className={cn("flex items-center gap-2", className)} {...props}>
    {children}
  </div>
);

interface PromptInputActionProps
  extends React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Root> {
  tooltip: React.ReactNode;
  children: React.ReactNode;
  side?: "top" | "bottom" | "left" | "right";
  className?: string;
}

export const PromptInputAction: React.FC<PromptInputActionProps> = ({
  tooltip,
  children,
  className,
  side = "top",
  ...props
}) => (
  <Tooltip {...props}>
    <TooltipTrigger asChild>{children}</TooltipTrigger>
    <TooltipContent side={side} className={className}>
      {tooltip}
    </TooltipContent>
  </Tooltip>
);

export const CustomDivider: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn("relative mx-1 h-6 w-[1.5px]", className)}>
    <div className="absolute inset-0 rounded-full bg-gradient-to-t from-transparent via-[#9b87f5]/70 to-transparent" />
  </div>
);

interface PromptInputBoxProps {
  onSend?: (message: string, files?: File[]) => void;
  isLoading?: boolean;
  placeholder?: string;
  className?: string;
}

export const PromptInputBox = React.forwardRef<HTMLDivElement, PromptInputBoxProps>(
  (
    { onSend = () => {}, isLoading = false, placeholder = "Type your message here...", className },
    ref,
  ) => {
    const [input, setInput] = React.useState("");
    const [files, setFiles] = React.useState<File[]>([]);
    const [filePreviews, setFilePreviews] = React.useState<Record<string, string>>({});
    const [selectedImage, setSelectedImage] = React.useState<string | null>(null);
    const [isRecording, setIsRecording] = React.useState(false);
    const [showSearch, setShowSearch] = React.useState(false);
    const [showThink, setShowThink] = React.useState(false);
    const [showCanvas, setShowCanvas] = React.useState(false);
    const uploadInputRef = React.useRef<HTMLInputElement>(null);
    const promptBoxRef = React.useRef<HTMLDivElement>(null);

    const isImageFile = (file: File) => file.type.startsWith("image/");

    const processFile = React.useCallback((file: File) => {
      if (!isImageFile(file)) return;
      if (file.size > 10 * 1024 * 1024) return;
      setFiles([file]);
      const reader = new FileReader();
      reader.onload = (event) => setFilePreviews({ [file.name]: String(event.target?.result) });
      reader.readAsDataURL(file);
    }, []);

    const handleToggleChange = (value: "search" | "think") => {
      if (value === "search") {
        setShowSearch((current) => !current);
        setShowThink(false);
        return;
      }
      setShowThink((current) => !current);
      setShowSearch(false);
    };

    const handleDragOver = React.useCallback((event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();
    }, []);

    const handleDrop = React.useCallback(
      (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
        const imageFile = Array.from(event.dataTransfer.files).find((file) => isImageFile(file));
        if (imageFile) processFile(imageFile);
      },
      [processFile],
    );

    const handleRemoveFile = (index: number) => {
      setFiles((current) => current.filter((_, fileIndex) => fileIndex !== index));
      setFilePreviews({});
    };

    const handlePaste = React.useCallback(
      (event: ClipboardEvent) => {
        const items = event.clipboardData?.items;
        if (!items) return;
        for (const item of Array.from(items)) {
          if (!item.type.includes("image")) continue;
          const file = item.getAsFile();
          if (!file) continue;
          event.preventDefault();
          processFile(file);
          break;
        }
      },
      [processFile],
    );

    React.useEffect(() => {
      document.addEventListener("paste", handlePaste);
      return () => document.removeEventListener("paste", handlePaste);
    }, [handlePaste]);

    const handleSubmit = () => {
      if (!input.trim() && files.length === 0) return;
      const messagePrefix = showSearch
        ? "[Search: "
        : showThink
          ? "[Think: "
          : showCanvas
            ? "[Canvas: "
            : "";
      const formattedInput = messagePrefix ? `${messagePrefix}${input}]` : input;
      onSend(formattedInput, files);
      setInput("");
      setFiles([]);
      setFilePreviews({});
    };

    const handleStopRecording = (duration: number) => {
      setIsRecording(false);
      onSend(`[Voice message - ${duration} seconds]`, []);
    };

    const hasContent = input.trim() !== "" || files.length > 0;

    return (
      <>
        <PromptInput
          value={input}
          onValueChange={setInput}
          isLoading={isLoading}
          onSubmit={handleSubmit}
          className={cn(
            "w-full border-[#444444] bg-[#1F2023] shadow-[0_8px_30px_rgba(0,0,0,0.24)] transition-all duration-300 ease-in-out",
            isRecording && "border-red-500/70",
            className,
          )}
          disabled={isLoading || isRecording}
          ref={ref || promptBoxRef}
          onDragOver={handleDragOver}
          onDragLeave={handleDragOver}
          onDrop={handleDrop}
        >
          {files.length > 0 && !isRecording ? (
            <div className="flex flex-wrap gap-2 pb-1 transition-all duration-300">
              {files.map((file, index) =>
                file.type.startsWith("image/") && filePreviews[file.name] ? (
                  <div key={file.name} className="group relative">
                    <button
                      type="button"
                      className="h-16 w-16 overflow-hidden rounded-xl"
                      onClick={() => setSelectedImage(filePreviews[file.name])}
                      aria-label={`Preview ${file.name}`}
                    >
                      <img
                        src={filePreviews[file.name]}
                        alt={file.name}
                        className="h-full w-full object-cover"
                      />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(index)}
                      className="absolute right-1 top-1 rounded-full bg-black/70 p-0.5"
                      aria-label={`Remove ${file.name}`}
                    >
                      <X className="h-3 w-3 text-white" aria-hidden="true" />
                    </button>
                  </div>
                ) : null,
              )}
            </div>
          ) : null}

          <div
            className={cn(
              "transition-all duration-300",
              isRecording ? "h-0 overflow-hidden opacity-0" : "opacity-100",
            )}
          >
            <PromptInputTextarea
              placeholder={
                showSearch
                  ? "Search the web..."
                  : showThink
                    ? "Think deeply..."
                    : showCanvas
                      ? "Create on canvas..."
                      : placeholder
              }
            />
          </div>

          <VoiceRecorder
            isRecording={isRecording}
            onStartRecording={() => undefined}
            onStopRecording={handleStopRecording}
          />

          <PromptInputActions className="justify-between gap-2 pt-2">
            <div
              className={cn(
                "flex min-w-0 items-center gap-1 transition-opacity duration-300",
                isRecording ? "invisible h-0 opacity-0" : "visible opacity-100",
              )}
            >
              <PromptInputAction tooltip="Upload image">
                <button
                  type="button"
                  onClick={() => uploadInputRef.current?.click()}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-[#9CA3AF] transition-colors hover:bg-gray-600/30 hover:text-[#D1D5DB]"
                  disabled={isRecording}
                >
                  <Paperclip className="h-5 w-5" aria-hidden="true" />
                  <input
                    ref={uploadInputRef}
                    type="file"
                    className="hidden"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) processFile(file);
                      event.currentTarget.value = "";
                    }}
                    accept="image/*"
                  />
                </button>
              </PromptInputAction>

              <button
                type="button"
                onClick={() => handleToggleChange("search")}
                className={cn(
                  "flex h-8 items-center gap-1 rounded-full border px-2 py-1 transition-all",
                  showSearch
                    ? "border-[#1EAEDB] bg-[#1EAEDB]/15 text-[#1EAEDB]"
                    : "border-transparent bg-transparent text-[#9CA3AF] hover:text-[#D1D5DB]",
                )}
              >
                <motion.span
                  animate={{ rotate: showSearch ? 360 : 0, scale: showSearch ? 1.1 : 1 }}
                  transition={{ type: "spring", stiffness: 260, damping: 25 }}
                  className="grid h-5 w-5 place-items-center"
                >
                  <Globe className="h-4 w-4" aria-hidden="true" />
                </motion.span>
                <AnimatePresence>
                  {showSearch ? (
                    <motion.span
                      initial={{ width: 0, opacity: 0 }}
                      animate={{ width: "auto", opacity: 1 }}
                      exit={{ width: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden whitespace-nowrap text-xs text-[#1EAEDB]"
                    >
                      Search
                    </motion.span>
                  ) : null}
                </AnimatePresence>
              </button>

              <CustomDivider />

              <button
                type="button"
                onClick={() => handleToggleChange("think")}
                className={cn(
                  "flex h-8 items-center gap-1 rounded-full border px-2 py-1 transition-all",
                  showThink
                    ? "border-[#8B5CF6] bg-[#8B5CF6]/15 text-[#8B5CF6]"
                    : "border-transparent bg-transparent text-[#9CA3AF] hover:text-[#D1D5DB]",
                )}
              >
                <motion.span
                  animate={{ rotate: showThink ? 360 : 0, scale: showThink ? 1.1 : 1 }}
                  transition={{ type: "spring", stiffness: 260, damping: 25 }}
                  className="grid h-5 w-5 place-items-center"
                >
                  <BrainCog className="h-4 w-4" aria-hidden="true" />
                </motion.span>
                <AnimatePresence>
                  {showThink ? (
                    <motion.span
                      initial={{ width: 0, opacity: 0 }}
                      animate={{ width: "auto", opacity: 1 }}
                      exit={{ width: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden whitespace-nowrap text-xs text-[#8B5CF6]"
                    >
                      Think
                    </motion.span>
                  ) : null}
                </AnimatePresence>
              </button>

              <CustomDivider />

              <button
                type="button"
                onClick={() => setShowCanvas((current) => !current)}
                className={cn(
                  "flex h-8 items-center gap-1 rounded-full border px-2 py-1 transition-all",
                  showCanvas
                    ? "border-[#F97316] bg-[#F97316]/15 text-[#F97316]"
                    : "border-transparent bg-transparent text-[#9CA3AF] hover:text-[#D1D5DB]",
                )}
              >
                <motion.span
                  animate={{ rotate: showCanvas ? 360 : 0, scale: showCanvas ? 1.1 : 1 }}
                  transition={{ type: "spring", stiffness: 260, damping: 25 }}
                  className="grid h-5 w-5 place-items-center"
                >
                  <FolderCode className="h-4 w-4" aria-hidden="true" />
                </motion.span>
                <AnimatePresence>
                  {showCanvas ? (
                    <motion.span
                      initial={{ width: 0, opacity: 0 }}
                      animate={{ width: "auto", opacity: 1 }}
                      exit={{ width: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden whitespace-nowrap text-xs text-[#F97316]"
                    >
                      Canvas
                    </motion.span>
                  ) : null}
                </AnimatePresence>
              </button>
            </div>

            <PromptInputAction
              tooltip={
                isLoading
                  ? "Stop generation"
                  : isRecording
                    ? "Stop recording"
                    : hasContent
                      ? "Send message"
                      : "Voice message"
              }
            >
              <Button
                variant="default"
                size="icon"
                className={cn(
                  "h-8 w-8 rounded-full transition-all duration-200",
                  isRecording
                    ? "bg-transparent text-red-500 hover:bg-gray-600/30 hover:text-red-400"
                    : hasContent
                      ? "bg-white text-[#1F2023] hover:bg-white/80"
                      : "bg-white text-[#1F2023] hover:bg-white/80",
                )}
                onClick={() => {
                  if (isRecording) setIsRecording(false);
                  else if (hasContent) handleSubmit();
                  else setIsRecording(true);
                }}
                disabled={isLoading && !hasContent}
              >
                {isLoading ? (
                  <Square className="h-4 w-4 fill-[#1F2023] animate-pulse" aria-hidden="true" />
                ) : isRecording ? (
                  <StopCircle className="h-5 w-5 text-red-500" aria-hidden="true" />
                ) : hasContent ? (
                  <ArrowUp className="h-4 w-4 text-[#1F2023]" aria-hidden="true" />
                ) : (
                  <Mic className="h-5 w-5 text-[#1F2023]" aria-hidden="true" />
                )}
              </Button>
            </PromptInputAction>
          </PromptInputActions>
        </PromptInput>

        <ImageViewDialog imageUrl={selectedImage} onClose={() => setSelectedImage(null)} />
      </>
    );
  },
);
PromptInputBox.displayName = "PromptInputBox";
