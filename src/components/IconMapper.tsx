import React from "react";
import {
  Sunrise,
  Dog,
  Brain,
  Target,
  School,
  Zap,
  Music,
  Moon,
  Award,
  Calendar,
  CheckCircle2,
  Cloud,
  Smartphone,
  Droplet,
  Sparkles,
  BookOpen,
  Code,
  Wallet,
  PenLine,
  Flame,
  Heart,
  Coffee,
  Dumbbell,
} from "lucide-react";

interface IconMapperProps {
  name: string;
  className?: string;
}

export function IconMapper({ name, className }: IconMapperProps) {
  const icons: Record<string, React.ComponentType<{ className?: string }>> = {
    sunrise: Sunrise,
    dog: Dog,
    brain: Brain,
    target: Target,
    school: School,
    zap: Zap,
    guitar: Music,
    moon: Moon,
    chess: Award,
    calendar: Calendar,
    cloud: Cloud,
    smartphone: Smartphone,
    droplet: Droplet,
    sparkles: Sparkles,
    book: BookOpen,
    code: Code,
    wallet: Wallet,
    edit: PenLine,
    flame: Flame,
    heart: Heart,
    coffee: Coffee,
    dumbbell: Dumbbell,
  };

  const IconComponent = icons[name] || CheckCircle2;
  return <IconComponent className={className} />;
}

export default IconMapper;
