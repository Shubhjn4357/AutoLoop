CREATE INDEX "businesses_user_idx" ON "businesses" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "businesses_email_idx" ON "businesses" USING btree ("email");--> statement-breakpoint
CREATE INDEX "businesses_email_status_idx" ON "businesses" USING btree ("email_status");--> statement-breakpoint
CREATE INDEX "businesses_created_at_idx" ON "businesses" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "businesses_user_status_idx" ON "businesses" USING btree ("user_id","email_status");--> statement-breakpoint
CREATE INDEX "email_logs_business_idx" ON "email_logs" USING btree ("business_id");--> statement-breakpoint
CREATE INDEX "email_logs_status_idx" ON "email_logs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "email_logs_sent_at_idx" ON "email_logs" USING btree ("sent_at");--> statement-breakpoint
CREATE INDEX "email_logs_business_status_idx" ON "email_logs" USING btree ("business_id","status");--> statement-breakpoint
CREATE INDEX "email_templates_user_idx" ON "email_templates" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "email_templates_default_idx" ON "email_templates" USING btree ("is_default");