"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { Send, CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export function ImmersiveContact() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simulate API call
    await new Promise(r => setTimeout(r, 2000));
    setIsSubmitting(false);
    setIsSent(true);
    toast.success("Message sent! We'll be in touch.");
  };

  return (
    <section className="py-32 bg-background/50 border-t border-border/50">
      <div className="container px-4">
        <div className="grid lg:grid-cols-2 gap-20 items-center">
          <div className="space-y-8">
            <h2 className="text-5xl md:text-7xl font-black tracking-tight leading-[0.9]">
              Ready to <br />
              <span className="text-primary italic underline decoration-primary/30">Loop?</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-md">
              Custom enterprise solutions, integration requests, or just want to say hi? 
              Our team (and our bots) are standing by.
            </p>
            
            <div className="flex gap-4">
               <div className="size-12 rounded-2xl bg-card border border-border flex items-center justify-center font-bold text-primary">A</div>
               <div className="size-12 rounded-2xl bg-card border border-border flex items-center justify-center font-bold text-primary">L</div>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="p-8 md:p-12 glass-card rounded-[2.5rem] border border-primary/20 shadow-2xl relative overflow-hidden"
          >
            {isSent ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                className="h-[400px] flex flex-col items-center justify-center text-center space-y-6"
              >
                <div className="size-24 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                  <CheckCircle className="size-12" />
                </div>
                <h3 className="text-3xl font-bold">Message Received!</h3>
                <p className="text-muted-foreground">We'll get back to you within 24 hours.</p>
                <Button variant="outline" onClick={() => setIsSent(false)}>Send Another</Button>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Your Name</Label>
                    <Input required placeholder="John Doe" className="bg-background/50 border-border/50 h-12 rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <Label>Email Address</Label>
                    <Input required type="email" placeholder="john@example.com" className="bg-background/50 border-border/50 h-12 rounded-xl" />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>How can we help?</Label>
                  <Textarea required placeholder="Tell us about your automation goals..." className="bg-background/50 border-border/50 min-h-[150px] rounded-2xl resize-none" />
                </div>

                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full h-14 rounded-2xl text-lg font-bold shadow-xl shadow-primary/20"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="size-5 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="size-5 mr-2" />
                      Send Message
                    </>
                  )}
                </Button>
              </form>
            )}

            {/* Decorative gradient */}
            <div className="absolute top-0 right-0 size-64 bg-primary/10 blur-[100px] -z-10" />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
