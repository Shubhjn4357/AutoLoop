"use client";
import { Switch } from "@/components/ui/switch";
import { useState } from "react";

export default function TestSwitchPage() {
  const [checked, setChecked] = useState(false);
  return (
    <div className="p-10 flex flex-col gap-4 items-center justify-center min-h-screen bg-background">
      <h1 className="text-2xl font-bold mb-4">Switch Animation Test</h1>
      <Switch checked={checked} onCheckedChange={setChecked} />
      <p>State: {checked ? "Checked" : "Unchecked"}</p>
      
      <div className="mt-10 p-6 glass-card rounded-2xl border border-white/10">
        <h2 className="text-lg font-bold mb-4">In a Card</h2>
        <div className="flex items-center justify-between gap-10">
           <span>Automation Active</span>
           <Switch checked={checked} onCheckedChange={setChecked} />
        </div>
      </div>
    </div>
  );
}
