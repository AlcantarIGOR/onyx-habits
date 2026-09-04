"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Mic,
  MapPin,
  Clock,
  Calendar,
  Radio,
  Copy,
  Check,
  Smartphone,
  Play,
  Volume2,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Loader2,
} from "lucide-react";

interface IosIntegrationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function IosIntegrationModal({
  isOpen,
  onClose,
}: IosIntegrationModalProps) {
  const [activeTab, setActiveTab] = useState<"siri" | "geofencing" | "shortcuts" | "calendar">("siri");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Live tester state
  const [testOutput, setTestOutput] = useState<{ key: string; text: string } | null>(null);
  const [testLoading, setTestLoading] = useState<string | null>(null);

  if (!isOpen) return null;

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://onyx-habits.vercel.app";

  const copyToClipboard = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const runLiveTest = async (key: string, url: string) => {
    setTestLoading(key);
    try {
      const res = await fetch(url);
      const text = await res.text();
      setTestOutput({ key, text });
    } catch (e) {
      setTestOutput({ key, text: "Error al conectar con el endpoint." });
    } finally {
      setTestLoading(null);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-background-dark/85 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-card-dark border border-border-dark/80 rounded-3xl p-5 sm:p-7 w-full max-w-2xl shadow-2xl relative space-y-5 max-h-[88vh] overflow-y-auto"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 sm:top-5 sm:right-5 p-2 text-text-muted hover:text-foreground rounded-xl bg-card-hover/50 hover:bg-card-hover transition cursor-pointer"
            aria-label="Cerrar modal"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Header */}
          <div className="flex items-center gap-3.5 pb-1">
            <div className="w-12 h-12 rounded-2xl bg-primary/15 border border-primary/30 flex items-center justify-center text-primary flex-shrink-0 shadow-lg shadow-primary/10">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/30">
                  iOS 18 + Siri
                </span>
                <span className="text-xs text-text-muted">iPhone 15 Suite</span>
              </div>
              <h2 className="text-lg font-bold text-foreground mt-0.5">
                Suite iPhone 15 & Asistente Siri
              </h2>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-background-dark/80 rounded-2xl border border-border-dark/60 overflow-x-auto scrollbar-none">
            <button
              onClick={() => setActiveTab("siri")}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition whitespace-nowrap cursor-pointer ${
                activeTab === "siri"
                  ? "bg-card-dark text-primary border border-primary/30 shadow-sm"
                  : "text-text-muted hover:text-foreground"
              }`}
            >
              <Mic className="w-3.5 h-3.5" />
              <span>Comandos Siri</span>
            </button>

            <button
              onClick={() => setActiveTab("geofencing")}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition whitespace-nowrap cursor-pointer ${
                activeTab === "geofencing"
                  ? "bg-card-dark text-accent-rose border border-accent-rose/30 shadow-sm"
                  : "text-text-muted hover:text-foreground"
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Geofencing TEC & Alarmas</span>
            </button>

            <button
              onClick={() => setActiveTab("shortcuts")}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition whitespace-nowrap cursor-pointer ${
                activeTab === "shortcuts"
                  ? "bg-card-dark text-accent-green border border-accent-green/30 shadow-sm"
                  : "text-text-muted hover:text-foreground"
              }`}
            >
              <Radio className="w-3.5 h-3.5" />
              <span>Centro de Control</span>
            </button>

            <button
              onClick={() => setActiveTab("calendar")}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition whitespace-nowrap cursor-pointer ${
                activeTab === "calendar"
                  ? "bg-card-dark text-accent-amber border border-accent-amber/30 shadow-sm"
                  : "text-text-muted hover:text-foreground"
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Apple Calendar</span>
            </button>
          </div>

          {/* ── TAB 1: COMANDOS SIRI ── */}
          {activeTab === "siri" && (
            <div className="space-y-4">
              <p className="text-xs text-text-muted leading-relaxed">
                Di cualquiera de estas frases a Siri en tu iPhone 15 o Apple Watch para interactuar 100% manos libres:
              </p>

              {/* Comando 1: Próxima clase */}
              <div className="bg-card-hover/60 border border-border-dark/60 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-base">🗣️</span>
                    <span className="text-xs font-bold text-foreground">
                      &quot;Oye Siri, ¿qué clase me toca?&quot;
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => runLiveTest("next-class", `/api/shortcuts?action=next-class&pin=3340`)}
                      className="text-[11px] px-2.5 py-1 rounded-lg bg-card-dark hover:bg-card-hover border border-border-dark/60 text-foreground font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      {testLoading === "next-class" ? <Loader2 className="w-3 h-3 animate-spin text-primary" /> : <Play className="w-3 h-3 text-primary fill-current" />}
                      <span>Probar respuesta</span>
                    </button>
                    <button
                      onClick={() => copyToClipboard("next-class", `${baseUrl}/api/shortcuts?action=next-class&pin=3340`)}
                      className="text-[11px] px-2.5 py-1 rounded-lg bg-primary/15 text-primary border border-primary/30 font-semibold flex items-center gap-1 hover:bg-primary/25 cursor-pointer"
                    >
                      {copiedKey === "next-class" ? <Check className="w-3 h-3 text-accent-green" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedKey === "next-class" ? "Copiado" : "Copiar URL"}</span>
                    </button>
                  </div>
                </div>

                <p className="text-[11px] text-text-muted">
                  <strong>En Atajos de iOS:</strong> Crear atajo llamado <em>&quot;¿Qué clase me toca?&quot;</em> ➔ Acción 1: <strong>Obtener contenido de URL</strong> ➔ Acción 2: <strong>Hablar texto</strong> (lee aula, materia y tiempo).
                </p>

                {testOutput?.key === "next-class" && (
                  <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="p-3 bg-background-dark/80 rounded-xl border border-primary/30 text-xs font-mono text-primary flex items-start gap-2">
                    <Volume2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span><strong>Siri dirá:</strong> &quot;{testOutput.text}&quot;</span>
                  </motion.div>
                )}
              </div>

              {/* Comando 1.2: Clases de mañana */}
              <div className="bg-card-hover/60 border border-border-dark/60 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-base">📅</span>
                    <span className="text-xs font-bold text-foreground">
                      &quot;Oye Siri, ¿qué clases tengo mañana?&quot;
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => runLiveTest("tomorrow-class", `/api/shortcuts?action=next-class&day=tomorrow&pin=3340`)}
                      className="text-[11px] px-2.5 py-1 rounded-lg bg-card-dark hover:bg-card-hover border border-border-dark/60 text-foreground font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      {testLoading === "tomorrow-class" ? <Loader2 className="w-3 h-3 animate-spin text-primary" /> : <Play className="w-3 h-3 text-primary fill-current" />}
                      <span>Probar respuesta</span>
                    </button>
                    <button
                      onClick={() => copyToClipboard("tomorrow-class", `${baseUrl}/api/shortcuts?action=next-class&day=tomorrow&pin=3340`)}
                      className="text-[11px] px-2.5 py-1 rounded-lg bg-primary/15 text-primary border border-primary/30 font-semibold flex items-center gap-1 hover:bg-primary/25 cursor-pointer"
                    >
                      {copiedKey === "tomorrow-class" ? <Check className="w-3 h-3 text-accent-green" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedKey === "tomorrow-class" ? "Copiado" : "Copiar URL"}</span>
                    </button>
                  </div>
                </div>

                <p className="text-[11px] text-text-muted">
                  <strong>En Atajos de iOS:</strong> Crear atajo llamado <em>&quot;¿Qué clases tengo mañana?&quot;</em> ➔ Acción 1: <strong>Obtener contenido de URL</strong> ➔ Acción 2: <strong>Hablar texto</strong>.
                </p>

                {testOutput?.key === "tomorrow-class" && (
                  <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="p-3 bg-background-dark/80 rounded-xl border border-primary/30 text-xs font-mono text-primary flex items-start gap-2">
                    <Volume2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span><strong>Siri dirá:</strong> &quot;{testOutput.text}&quot;</span>
                  </motion.div>
                )}
              </div>

              {/* Comando 2: Tarea por voz */}
              <div className="bg-card-hover/60 border border-border-dark/60 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-base">🎙️</span>
                    <span className="text-xs font-bold text-foreground">
                      &quot;Oye Siri, anota una tarea en Mi Espacio&quot;
                    </span>
                  </div>
                  <button
                    onClick={() => copyToClipboard("add-task", `${baseUrl}/api/shortcuts?action=task&pin=3340&text=`)}
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-primary/15 text-primary border border-primary/30 font-semibold flex items-center gap-1 hover:bg-primary/25 cursor-pointer"
                  >
                    {copiedKey === "add-task" ? <Check className="w-3 h-3 text-accent-green" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedKey === "add-task" ? "Copiado" : "Copiar URL Base"}</span>
                  </button>
                </div>
                <p className="text-[11px] text-text-muted">
                  <strong>En Atajos de iOS:</strong> Acción 1: <strong>Solicitar entrada (Texto: &quot;¿Qué tarea deseas anotar?&quot;)</strong> ➔ Acción 2: <strong>Obtener contenido de URL</strong> (<code className="text-primary font-mono text-[10px]">...&text=[Texto proporcionado]</code>). Clasifica como Alta si dices <em>&quot;urgente&quot;</em>.
                </p>
              </div>

              {/* Comando 3: Briefing del día */}
              <div className="bg-card-hover/60 border border-border-dark/60 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-base">🌅</span>
                    <span className="text-xs font-bold text-foreground">
                      &quot;Oye Siri, reporte del día&quot;
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => runLiveTest("briefing", `/api/shortcuts?action=briefing&pin=3340`)}
                      className="text-[11px] px-2.5 py-1 rounded-lg bg-card-dark hover:bg-card-hover border border-border-dark/60 text-foreground font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      {testLoading === "briefing" ? <Loader2 className="w-3 h-3 animate-spin text-primary" /> : <Play className="w-3 h-3 text-primary fill-current" />}
                      <span>Probar respuesta</span>
                    </button>
                    <button
                      onClick={() => copyToClipboard("briefing", `${baseUrl}/api/shortcuts?action=briefing&pin=3340`)}
                      className="text-[11px] px-2.5 py-1 rounded-lg bg-primary/15 text-primary border border-primary/30 font-semibold flex items-center gap-1 hover:bg-primary/25 cursor-pointer"
                    >
                      {copiedKey === "briefing" ? <Check className="w-3 h-3 text-accent-green" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedKey === "briefing" ? "Copiado" : "Copiar URL"}</span>
                    </button>
                  </div>
                </div>

                <p className="text-[11px] text-text-muted">
                  Siri te resume por voz: primera materia en el TEC, hábitos fundamentales faltantes y tareas prioritarias.
                </p>

                {testOutput?.key === "briefing" && (
                  <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="p-3 bg-background-dark/80 rounded-xl border border-primary/30 text-xs font-mono text-primary flex items-start gap-2">
                    <Volume2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span><strong>Siri dirá:</strong> &quot;{testOutput.text}&quot;</span>
                  </motion.div>
                )}
              </div>
            </div>
          )}

          {/* ── TAB 2: GEOFENCING & ALARMAS ── */}
          {activeTab === "geofencing" && (
            <div className="space-y-4">
              <p className="text-xs text-text-muted leading-relaxed">
                En la app <strong className="text-foreground">Atajos &gt; Automatización</strong> de iOS, crea estas automatizaciones que se ejecutan solas en segundo plano:
              </p>

              {/* 1. Al llegar al TEC */}
              <div className="bg-card-hover/60 border border-border-dark/60 rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-accent-rose" />
                    <span className="text-xs font-bold text-foreground">
                      1. Al llegar al Campus TEC (Geolocalización)
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-accent-rose font-bold px-2 py-0.5 rounded-full bg-accent-rose/15 border border-accent-rose/30">
                    Geocerca
                  </span>
                </div>
                <p className="text-[11px] text-text-muted">
                  <strong>Disparador:</strong> <em>Al llegar a Tecnológico de Monterrey</em> ➔ Marcar <strong>Ejecutar inmediatamente</strong> ➔ <strong>Obtener contenido de URL</strong> (<code className="text-primary font-mono text-[10px]">{baseUrl}/api/shortcuts?action=next-class&pin=3340</code>) y <strong>Mostrar notificación</strong> con el salón y materia.
                </p>
              </div>

              {/* 2. Al apagar la alarma 6 AM */}
              <div className="bg-card-hover/60 border border-border-dark/60 rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-accent-amber" />
                    <span className="text-xs font-bold text-foreground">
                      2. Al detener alarma 06:00 AM (Auto-Registro +30 XP)
                    </span>
                  </div>
                  <button
                    onClick={() => copyToClipboard("alarm", `${baseUrl}/api/shortcuts?action=alarm-wakeup&pin=3340`)}
                    className="text-[11px] text-primary font-semibold flex items-center gap-1 hover:underline cursor-pointer"
                  >
                    {copiedKey === "alarm" ? <Check className="w-3 h-3 text-accent-green" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedKey === "alarm" ? "Copiado" : "Copiar URL"}</span>
                  </button>
                </div>
                <p className="text-[11px] text-text-muted">
                  <strong>Disparador:</strong> <em>Al detener alarma de las 6:00 AM</em> ➔ Llama al endpoint de alarma, marca tu hábito de despertar (+30 XP) y Siri te lee el briefing del día.
                </p>
              </div>

              {/* 3. Desconexión nocturna 21:45 PM */}
              <div className="bg-card-hover/60 border border-border-dark/60 rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">🌙</span>
                    <span className="text-xs font-bold text-foreground">
                      3. Rutina Nocturna 21:45 PM (Preparación para Dormir)
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-accent-violet font-bold px-2 py-0.5 rounded-full bg-accent-violet/15 border border-accent-violet/30">
                    Horario
                  </span>
                </div>
                <p className="text-[11px] text-text-muted">
                  <strong>Disparador:</strong> <em>Hora del día: 21:45 PM</em> ➔ Activa el modo <strong>Enfoque Sueño</strong> y te manda una notificación para desconectar pantallas y dormir a las 22:15.
                </p>
              </div>
            </div>
          )}

          {/* ── TAB 3: CENTRO DE CONTROL ── */}
          {activeTab === "shortcuts" && (
            <div className="space-y-4">
              <p className="text-xs text-text-muted leading-relaxed">
                Agrega este atajo a tu <strong className="text-foreground">Centro de Control de iOS 18</strong> o al <strong className="text-foreground">Botón de Acción</strong> de tu iPhone 15:
              </p>

              <div className="bg-card-hover/60 border border-border-dark/60 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Radio className="w-4 h-4 text-accent-green" />
                    <span className="text-xs font-bold text-foreground">
                      Atajo &quot;Completar Hábito&quot; (Menú Interactivo)
                    </span>
                  </div>
                  <button
                    onClick={() => copyToClipboard("menu", `${baseUrl}/api/shortcuts?action=menu&pin=3340`)}
                    className="text-[11px] text-primary font-semibold flex items-center gap-1 hover:underline cursor-pointer"
                  >
                    {copiedKey === "menu" ? <Check className="w-3 h-3 text-accent-green" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedKey === "menu" ? "Copiado" : "Copiar URL 1"}</span>
                  </button>
                </div>

                <div className="text-xs space-y-2 text-text-muted">
                  <p><strong>Paso 1:</strong> Obtener contenido de <code className="text-primary font-mono text-[11px]">{baseUrl}/api/shortcuts?action=menu&pin=3340</code></p>
                  <p><strong>Paso 2:</strong> Elegir de la lista <code className="text-foreground font-mono text-[11px]">[Contenido de URL]</code></p>
                  <p><strong>Paso 3:</strong> Obtener contenido de <code className="text-primary font-mono text-[11px]">{baseUrl}/api/shortcuts?action=log&pin=3340&name=[Elemento seleccionado]</code></p>
                  <p><strong>Paso 4:</strong> Detener y mostrar resultado de <code className="text-foreground font-mono text-[11px]">[Contenido de URL]</code></p>
                </div>
              </div>
            </div>
          )}

          {/* ── TAB 4: CALENDAR ICAL ── */}
          {activeTab === "calendar" && (
            <div className="space-y-4">
              <p className="text-xs text-text-muted leading-relaxed">
                Sincroniza tus materias, salones y horarios con la app oficial de <strong className="text-foreground">Calendario de Apple</strong>:
              </p>

              <div className="bg-card-hover/60 border border-border-dark/60 rounded-2xl p-4 space-y-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={`${baseUrl}/api/schedule/ical`}
                    className="flex-1 bg-background-dark border border-border-dark/70 text-foreground font-mono text-xs rounded-xl px-3 py-2 focus:outline-none"
                  />
                  <button
                    onClick={() => copyToClipboard("ical", `${baseUrl}/api/schedule/ical`)}
                    className="px-4 py-2 bg-primary text-background-dark font-bold text-xs rounded-xl hover:bg-primary/90 transition cursor-pointer flex items-center gap-1.5"
                  >
                    {copiedKey === "ical" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === "ical" ? "Copiado" : "Copiar"}</span>
                  </button>
                </div>

                <div className="text-xs text-text-muted space-y-1.5 pt-1">
                  <p><strong>En tu iPhone 15:</strong></p>
                  <ol className="list-decimal list-inside space-y-1 pl-1 text-[11px]">
                    <li>Abre la app <strong>Calendario</strong> &gt; toca <strong>Calendarios</strong> abajo.</li>
                    <li>Toca <strong>Agregar calendario</strong> &gt; <strong>Agregar suscripción a calendario</strong>.</li>
                    <li>Pega el enlace copiado arriba y toca <strong>Suscribirse</strong>.</li>
                  </ol>
                </div>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="flex justify-end pt-2 border-t border-border-dark/50">
            <button
              onClick={onClose}
              className="px-5 py-2 bg-primary text-background-dark font-bold text-xs rounded-xl hover:bg-primary/90 transition cursor-pointer shadow-lg shadow-primary/20"
            >
              Listo
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
