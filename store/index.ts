import { create } from "zustand";
import { Business, EmailTemplate, AutomationWorkflow } from "@/types";

interface BusinessStore {
  businesses: Business[];
  selectedBusiness: Business | null;
  filters: {
    search: string;
    emailStatus: string[];
    category: string[];
  };
  setBusinesses: (businesses: Business[]) => void;
  addBusiness: (business: Business) => void;
  updateBusiness: (id: string, data: Partial<Business>) => void;
  setSelectedBusiness: (business: Business | null) => void;
  setFilters: (filters: Partial<BusinessStore["filters"]>) => void;
}

export const useBusinessStore = create<BusinessStore>((set) => ({
  businesses: [],
  selectedBusiness: null,
  filters: {
    search: "",
    emailStatus: [],
    category: [],
  },
  setBusinesses: (businesses) => set({ businesses }),
  addBusiness: (business) =>
    set((state) => ({ businesses: [business, ...state.businesses] })),
  updateBusiness: (id, data) =>
    set((state) => ({
      businesses: state.businesses.map((b) =>
        b.id === id ? { ...b, ...data } : b
      ),
    })),
  setSelectedBusiness: (business) => set({ selectedBusiness: business }),
  setFilters: (filters) =>
    set((state) => ({ filters: { ...state.filters, ...filters } })),
}));

interface TemplateStore {
  templates: EmailTemplate[];
  selectedTemplate: EmailTemplate | null;
  setTemplates: (templates: EmailTemplate[]) => void;
  addTemplate: (template: EmailTemplate) => void;
  updateTemplate: (id: string, data: Partial<EmailTemplate>) => void;
  deleteTemplate: (id: string) => void;
  setSelectedTemplate: (template: EmailTemplate | null) => void;
}

export const useTemplateStore = create<TemplateStore>((set) => ({
  templates: [],
  selectedTemplate: null,
  setTemplates: (templates) => set({ templates }),
  addTemplate: (template) =>
    set((state) => ({ templates: [...state.templates, template] })),
  updateTemplate: (id, data) =>
    set((state) => ({
      templates: state.templates.map((t) =>
        t.id === id ? { ...t, ...data } : t
      ),
    })),
  deleteTemplate: (id) =>
    set((state) => ({
      templates: state.templates.filter((t) => t.id !== id),
    })),
  setSelectedTemplate: (template) => set({ selectedTemplate: template }),
}));

interface WorkflowStore {
  workflows: AutomationWorkflow[];
  activeWorkflow: AutomationWorkflow | null;
  setWorkflows: (workflows: AutomationWorkflow[]) => void;
  addWorkflow: (workflow: AutomationWorkflow) => void;
  updateWorkflow: (id: string, data: Partial<AutomationWorkflow>) => void;
  deleteWorkflow: (id: string) => void;
  setActiveWorkflow: (workflow: AutomationWorkflow | null) => void;
}

export const useWorkflowStore = create<WorkflowStore>((set) => ({
  workflows: [],
  activeWorkflow: null,
  setWorkflows: (workflows) => set({ workflows }),
  addWorkflow: (workflow) =>
    set((state) => ({ workflows: [...state.workflows, workflow] })),
  updateWorkflow: (id, data) =>
    set((state) => ({
      workflows: state.workflows.map((w) =>
        w.id === id ? { ...w, ...data } : w
      ),
    })),
  deleteWorkflow: (id) =>
    set((state) => ({
      workflows: state.workflows.filter((w) => w.id !== id),
    })),
  setActiveWorkflow: (workflow) => set({ activeWorkflow: workflow }),
}));
