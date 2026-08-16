import React from "react";
import {
  Hammer, Wrench, Plug, PaintRoller, Building2, Armchair, RectangleVertical,
  KeyRound, Sparkles, Pickaxe, Refrigerator, Cpu, Car, MonitorSmartphone,
  Smartphone, Shirt, Scissors, HandHeart, Dumbbell, HeartPulse, Truck,
  Package, CarFront, LifeBuoy, Calculator, Scale, Languages, FileText,
  Briefcase, Globe, Code2, PenTool, BarChart3, Camera, Server, GraduationCap,
  BookOpen, Music, Mic, PartyPopper, Utensils, Bike, ShoppingBasket, Baby,
  HeartHandshake, PawPrint, Trees, Axe, Leaf, MoreHorizontal
} from "lucide-react";
import { categoryIcon } from "@/lib/categories";

const MAP = {
  Hammer, Wrench, Plug, PaintRoller, Building2, Armchair, RectangleVertical,
  KeyRound, Sparkles, Pickaxe, Refrigerator, Cpu, Car, MonitorSmartphone,
  Smartphone, Shirt, Scissors, HandHeart, Dumbbell, HeartPulse, Truck,
  Package, CarFront, LifeBuoy, Calculator, Scale, Languages, FileText,
  Briefcase, Globe, Code2, PenTool, BarChart3, Camera, Server, GraduationCap,
  BookOpen, Music, Mic, PartyPopper, Utensils, Bike, ShoppingBasket, Baby,
  HeartHandshake, PawPrint, Trees, Axe, Leaf, MoreHorizontal
};

export default function CategoryIcon({ code, className = "w-4 h-4" }) {
  const Cmp = MAP[categoryIcon(code)] || MoreHorizontal;
  return <Cmp className={className} />;
}