import {
  BadgeCheck,
  BarChart3,
  Blocks,
  Bot,
  CalendarClock,
  CheckCircle2,
  CreditCard,
  FileText,
  Globe2,
  Headphones,
  LayoutDashboard,
  LockKeyhole,
  MessageSquareText,
  ShieldCheck,
  Sparkles,
  UsersRound,
  Workflow,
  Zap
} from 'lucide-react';

export const brand = {
  name: 'EditorFlow',
  tagline: 'Workflow Management for Creative Teams',
  supportEmail: 'support@editorflow.com',
  phone: '+91 80 4321 9876',
  address: 'Bengaluru, Karnataka, India'
};

export const navLinks = [
  { label: 'Home', path: '/' },
  { label: 'Features', path: '/features' },
  { label: 'Pricing', path: '/pricing' },
  { label: 'About us', path: '/about' },
  { label: 'Contact us', path: '/contact' }
];

export const heroMetrics = [
  { value: '3x', label: 'faster review cycles' },
  { value: '40%', label: 'less context switching' },
  { value: '24/7', label: 'post-production visibility' }
];

export const trustLogos = ['Vinci Studio', 'Aether Media', 'Echo Films', 'Neon Cut', 'Vertex Post', 'BrightLabs'];

export const features = [
  {
    title: 'Unified project boards',
    description: 'Plan tasks, realign cards, track editors, and keep every post-production stage visible from a single board view.',
    icon: LayoutDashboard
  },
  {
    title: 'Team chat beside work',
    description: 'Discuss edits without losing the context. Conversations stay attached to specific cards and delivery milestones.',
    icon: MessageSquareText
  },
  {
    title: 'Smart task creation',
    description: 'Create structured tasks with priority levels, due dates, assignee editors, and review checklists.',
    icon: CalendarClock
  },
  {
    title: 'Automation rules',
    description: 'Move work, assign reviewers, send reminders, and trigger status updates when assets are approved.',
    icon: Workflow
  },
  {
    title: 'AI project assistant',
    description: 'Summarize feedback blockers, generate editing logs, draft title scripts, and identify delivery bottlenecks.',
    icon: Bot
  },
  {
    title: 'Analytics dashboard',
    description: 'Track editor workloads, cycles times, media review progress, and studio delivery health.',
    icon: BarChart3
  }
];

export const productCards = [
  {
    title: 'Plan the work',
    description: 'Build roadmaps, organize Kanban boards, and define deadlines for every edit.',
    cta: 'Explore planning',
    icon: Blocks
  },
  {
    title: 'Collaborate in context',
    description: 'Keep chat, task cards, review files, and edit logs connected so feedback never gets lost.',
    cta: 'See collaboration',
    icon: UsersRound
  },
  {
    title: 'Automate delivery',
    description: 'Replace manual reminders with smart rules, slack/email alerts, and workspace approvals.',
    cta: 'View automation',
    icon: Zap
  },
  {
    title: 'Report with confidence',
    description: 'Turn live post-production milestones into client-ready reports and performance insights.',
    cta: 'Open reporting',
    icon: FileText
  }
];

export const stats = [
  { value: '160+', label: 'creative templates' },
  { value: '99.9%', label: 'system uptime' },
  { value: '12+', label: 'workspace views' },
  { value: '1 place', label: 'for creative truth' }
];

export const benefits = [
  {
    title: 'Keep work aligned',
    description: 'Give every creator a shared workspace where editor roles, review status, and priorities are clear.',
    icon: CheckCircle2
  },
  {
    title: 'Protect media assets',
    description: 'Role-based access, workspace permissions, activity logs, and secure database connections keep raw assets safe.',
    icon: ShieldCheck
  },
  {
    title: 'Move faster without chaos',
    description: 'Automations and status updates reduce manual coordination, freeing up editors to focus on the timeline.',
    icon: Sparkles
  },
  {
    title: 'Support every team style',
    description: 'Use boards, lists, calendars, and review panels so every editor can work in the layout they prefer.',
    icon: Globe2
  }
];

export const customerSegments = [
  {
    title: 'Video & Creative teams',
    description: 'Prioritize editing roadmaps, convert client revisions into tasks, and ship finalized cuts without gaps.'
  },
  {
    title: 'Post-production agencies',
    description: 'Standardize recurring review cycles, editor assignments, and reviewer approvals across client pipelines.'
  },
  {
    title: 'Boutique studios',
    description: 'Manage multiple workspace boards, file approvals, timelines, and communications in one polished application.'
  }
];

export const testimonials = [
  {
    quote: 'EditorFlow helped us replace scattered client emails and messy drive links with one clean review hub.',
    name: 'Sarah Robinson',
    role: 'Creative Director, Vinci Studio'
  },
  {
    quote: 'The board, context chat, and task creation flow makes coordinating freelance editors completely painless.',
    name: 'Marcus Jenkins',
    role: 'Lead Editor, Echo Films'
  },
  {
    quote: 'Our client sign-offs are twice as fast because task history and video reviews are fully integrated.',
    name: 'Riya Shah',
    role: 'Operations Lead, BrightOps'
  }
];

export const pricingPlans = [
  {
    name: 'Free',
    price: '$0',
    cadence: 'forever',
    description: 'Ideal for self-starters and small projects.',
    features: ['1 Active Workspace', 'Up to 4 Member Accounts', '2 GB Workspace Storage', 'Basic Task Board', 'General Chat Channels'],
    cta: 'Start free'
  },
  {
    name: 'Growth',
    price: '$25',
    cadence: 'per month',
    description: 'Perfect for growing studios and boutique shops.',
    features: ['5 Active Workspaces', 'Up to 20 Member Accounts', '1 TB Workspace Storage', 'Priority Support SLA', 'Direct Invites & Join Links'],
    cta: 'Choose Growth',
    popular: true
  },
  {
    name: 'Custom',
    price: 'Custom',
    cadence: 'contact sales',
    description: 'For large-scale media agencies and networks.',
    features: ['Unlimited Workspaces', 'Custom Seats & Collaborators', 'Multi-TB / Dedicated Storage', 'Dedicated Account Support', 'Custom Branding Options'],
    cta: 'Contact sales'
  }
];

export const securityHighlights = [
  { title: 'Role-based access', icon: LockKeyhole },
  { title: 'Secure billing', icon: CreditCard },
  { title: 'Verified workflows', icon: BadgeCheck },
  { title: 'Dedicated support', icon: Headphones }
];

export const footerSections = [
  {
    title: 'Product',
    links: [
      { label: 'Features', path: '/features' },
      { label: 'Pricing', path: '/pricing' },
      { label: 'Login / Sign-up', path: '/login' }
    ]
  },
  {
    title: 'Company',
    links: [
      { label: 'About us', path: '/about' },
      { label: 'Contact us', path: '/contact' }
    ]
  },
  {
    title: 'Help',
    links: [
      { label: 'Privacy Policy', path: '/privacy-policy' },
      { label: 'Support', path: '/contact' }
    ]
  }
];
