"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, MessageSquare, Send } from "lucide-react";

export default function FeedbackPage() {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        subject: "",
        message: "",
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const res = await fetch("/api/feedback", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...formData,
                    type: "contact"
                })
            });

            if (!res.ok) throw new Error("Failed to send message");

            setSubmitted(true);
            setFormData({ name: "", email: "", subject: "", message: "" });

            // Reset success message after 5 seconds
            //setTimeout(() => setSubmitted(false), 5000);
        } catch (error) {
            console.error("Failed to submit feedback", error);
            // Optional: show error toast or state
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
    };

    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-5xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
                <div className="space-y-8">
                    {/* Header */}
                    <div className="space-y-4 text-center">
                        <Link href="/" className="text-sm text-primary hover:underline inline-block">
                            ← Back to Home
                        </Link>
                        <h1 className="text-4xl font-bold tracking-tight">Contact & Feedback</h1>
                        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                            We&apos;d love to hear from you! Whether you have a question, feedback, or need support, feel free to reach out.
                        </p>
                    </div>

                    <div className="grid gap-8 md:grid-cols-2">
                        {/* Contact Information */}
                        <div className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Mail className="h-5 w-5" />
                                        Get in Touch
                                    </CardTitle>
                                    <CardDescription>
                                        Choose your preferred way to contact us
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <h3 className="font-semibold">General Inquiries</h3>
                                        <p className="text-sm text-muted-foreground">
                                            Email: <a href="mailto:hello@autoloop.com" className="text-primary hover:underline">hello@autoloop.com</a>
                                        </p>
                                    </div>

                                    <div className="space-y-2">
                                        <h3 className="font-semibold">Support</h3>
                                        <p className="text-sm text-muted-foreground">
                                            Email: <a href="mailto:support@autoloop.com" className="text-primary hover:underline">support@autoloop.com</a>
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            Response time: Within 24 hours
                                        </p>
                                    </div>

                                    <div className="space-y-2">
                                        <h3 className="font-semibold">Sales</h3>
                                        <p className="text-sm text-muted-foreground">
                                            Email: <a href="mailto:sales@autoloop.com" className="text-primary hover:underline">sales@autoloop.com</a>
                                        </p>
                                    </div>

                                    <div className="space-y-2">
                                        <h3 className="font-semibold">Privacy & Legal</h3>
                                        <p className="text-sm text-muted-foreground">
                                            Email: <a href="mailto:legal@autoloop.com" className="text-primary hover:underline">legal@autoloop.com</a>
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <MessageSquare className="h-5 w-5" />
                                        What We Value in Feedback
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ul className="space-y-2 text-sm text-muted-foreground">
                                        <li className="flex items-start gap-2">
                                            <span className="text-primary mt-1">•</span>
                                            <span>Feature requests and suggestions</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="text-primary mt-1">•</span>
                                            <span>Bug reports and technical issues</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="text-primary mt-1">•</span>
                                            <span>User experience improvements</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="text-primary mt-1">•</span>
                                            <span>Integration requests</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="text-primary mt-1">•</span>
                                            <span>General feedback and testimonials</span>
                                        </li>
                                    </ul>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Contact Form */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Send us a Message</CardTitle>
                                <CardDescription>
                                    Fill out the form below and we&apos;ll get back to you soon
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {submitted ? (
                                    <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-6 text-center">
                                        <div className="flex justify-center mb-3">
                                            <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                                                <Send className="h-6 w-6 text-green-600 dark:text-green-400" />
                                            </div>
                                        </div>
                                        <h3 className="font-semibold text-green-900 dark:text-green-100 mb-2">
                                            Message Sent!
                                        </h3>
                                        <p className="text-sm text-green-700 dark:text-green-300">
                                            Thank you for your feedback. We&apos;ll get back to you as soon as possible.
                                        </p>
                                    </div>
                                ) : (
                                    <form onSubmit={handleSubmit} className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="name">Name</Label>
                                            <Input
                                                id="name"
                                                name="name"
                                                placeholder="Your name"
                                                value={formData.name}
                                                onChange={handleChange}
                                                required
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="email">Email</Label>
                                            <Input
                                                id="email"
                                                name="email"
                                                type="email"
                                                placeholder="your@email.com"
                                                value={formData.email}
                                                onChange={handleChange}
                                                required
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="subject">Subject</Label>
                                            <Input
                                                id="subject"
                                                name="subject"
                                                placeholder="What is this about?"
                                                value={formData.subject}
                                                onChange={handleChange}
                                                required
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="message">Message</Label>
                                            <Textarea
                                                id="message"
                                                name="message"
                                                placeholder="Tell us more..."
                                                rows={6}
                                                value={formData.message}
                                                onChange={handleChange}
                                                required
                                            />
                                        </div>

                                        <Button
                                            type="submit"
                                            className="w-full"
                                            disabled={isSubmitting}
                                        >
                                            {isSubmitting ? (
                                                <>
                                                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                                                    Sending...
                                                </>
                                            ) : (
                                                <>
                                                    <Send className="mr-2 h-4 w-4" />
                                                    Send Message
                                                </>
                                            )}
                                        </Button>
                                    </form>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* FAQ Section */}
                    <div className="mt-12">
                        <h2 className="text-2xl font-bold mb-6 text-center">Frequently Asked Questions</h2>
                        <div className="grid gap-6 md:grid-cols-2">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">How quickly will I get a response?</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground">
                                        We aim to respond to all inquiries within 24 hours during business days. For urgent matters, please mark your email subject with &quot;URGENT&quot;.
                                    </p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Can I request a feature?</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground">
                                        Absolutely! We love hearing feature requests from our users. Please provide as much detail as possible about what you&apos;d like to see.
                                    </p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Do you offer phone support?</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground">
                                        Currently, we provide support via email. For enterprise customers, we offer dedicated account managers with phone support.
                                    </p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">How do I report a bug?</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground">
                                        Please email us at support@autoloop.com with details about the bug, steps to reproduce it, and any screenshots if possible.
                                    </p>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
