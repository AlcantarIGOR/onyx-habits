"use client";

import React, { useState, useEffect, KeyboardEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { storage, StickyNote } from "@/lib/storage";

const COLORS = [
  "#8B9FCA", // periwinkle
  "#7EC89B", // sage
  "#D4A574", // warm amber
  "#C4787E", // dusty rose
  "#9B8EC4", // soft violet
];

export function StickyNotes() {
  const [notes, setNotes] = useState<StickyNote[]>([]);
  const [newNoteContent, setNewNoteContent] = useState("");
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);

  useEffect(() => {
    const loadedNotes = storage.getStickyNotes();
    setNotes(loadedNotes);
  }, []);

  const handleAddNote = () => {
    if (!newNoteContent.trim()) return;
    const newNote = storage.saveStickyNote({
      content: newNoteContent.trim(),
      color: selectedColor,
    });
    setNotes((prev) => [newNote, ...prev]);
    setNewNoteContent("");
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddNote();
    }
  };

  const handleDelete = (id: string) => {
    storage.deleteStickyNote(id);
    setNotes((prev) => prev.filter((n) => n.id !== id));
  };

  const displayNotes = notes.slice(0, 5);

  return (
    <div className="flex flex-col w-full gap-4">
      <div className="flex flex-col gap-2.5">
        <AnimatePresence initial={false}>
          {displayNotes.map((note) => (
            <motion.div
              key={note.id}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="group relative flex items-start px-4 py-3.5 bg-card-dark/50 rounded-xl overflow-hidden"
            >
              {/* Left accent */}
              <div
                className="absolute left-0 top-2 bottom-2 w-[2px] rounded-full"
                style={{ backgroundColor: `${note.color}60` }}
              />
              
              <p className="pl-1 pr-6 text-[13px] italic text-foreground/60 w-full break-words leading-relaxed">
                &ldquo;{note.content}&rdquo;
              </p>

              <button
                onClick={() => handleDelete(note.id)}
                className="opacity-0 group-hover:opacity-100 transition-opacity absolute right-2 top-2 p-1 text-text-muted hover:text-foreground/60 rounded-md"
                aria-label="Eliminar nota"
              >
                <X className="w-3 h-3" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {displayNotes.length === 0 && (
          <p className="text-[13px] text-text-muted py-10 text-center">
            Escribe una frase motivacional o nota personal abajo.
          </p>
        )}
      </div>

      {/* Add note input */}
      <div className="flex flex-col gap-2.5 px-4 py-3.5 bg-card-dark/50 rounded-xl">
        <input
          type="text"
          value={newNoteContent}
          onChange={(e) => setNewNoteContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Escribe una frase o nota..."
          className="w-full bg-transparent text-[13px] text-foreground/80 placeholder-text-muted/50 outline-none"
        />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {COLORS.map((color) => (
              <button
                key={color}
                onClick={() => setSelectedColor(color)}
                className={`w-3.5 h-3.5 rounded-full transition-all ${
                  selectedColor === color
                    ? "scale-110 ring-1 ring-offset-2 ring-offset-card-dark"
                    : "opacity-50 hover:opacity-80"
                }`}
                style={{
                  backgroundColor: color,
                  "--tw-ring-color": color,
                } as React.CSSProperties}
                aria-label={`Seleccionar color`}
                type="button"
              />
            ))}
          </div>
          <span className="text-[10px] text-text-muted select-none">
            Enter ↵
          </span>
        </div>
      </div>
    </div>
  );
}
