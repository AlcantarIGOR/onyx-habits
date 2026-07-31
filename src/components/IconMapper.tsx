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
  };

  const IconComponent = icons[name] || CheckCircle2;
  return <IconComponent className={className} />;
}

export default IconMapper;
