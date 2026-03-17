import {
  Building2,
  Compass,
  GraduationCap,
  Library,
  School,
  ShieldCheck,
  University,
  Users,
  Wrench,
  Factory,
  BookOpen,
} from "lucide-react";

export const routeOptions = [
  {
    id: "build",
    title: "Build an institution",
    description: "Create a workspace for your school, college, or campus.",
    icon: Building2,
  },
  {
    id: "join",
    title: "Join an institution",
    description: "Enter with an invite or connect to an existing workspace.",
    icon: BookOpen,
  },
  {
    id: "personal",
    title: "Start as me",
    description: "Begin with your personal Skuully space and grow from there.",
    icon: Compass,
  },
] as const;

export const institutionOptions = [
  {
    id: "SCHOOL",
    title: "School",
    description: "For primary and secondary schools.",
    icon: School,
  },
  {
    id: "COLLEGE",
    title: "College",
    description: "For colleges and advanced institutions.",
    icon: Library,
  },
  {
    id: "UNIVERSITY",
    title: "University",
    description: "For faculties, departments, and broader academic systems.",
    icon: University,
  },
  {
    id: "POLYTECHNIC",
    title: "Polytechnic",
    description: "For practical and technical institutions.",
    icon: Wrench,
  },
  {
    id: "VOCATIONAL",
    title: "Vocational / TVET",
    description: "For skills, training, and workforce pathways.",
    icon: Factory,
  },
  {
    id: "ACADEMY",
    title: "Academy",
    description: "For focused learning communities and private institutions.",
    icon: ShieldCheck,
  },
] as const;

export const joinOptions = [
  {
    id: "invite",
    title: "I have an invite",
    description: "Use an invite code to enter your institution.",
    icon: ShieldCheck,
  },
  {
    id: "teacher",
    title: "I’m a teacher",
    description: "Connect to your institution as a teacher.",
    icon: GraduationCap,
  },
  {
    id: "student",
    title: "I’m a student",
    description: "Join your learning space and academic life.",
    icon: BookOpen,
  },
  {
    id: "parent",
    title: "I’m a parent",
    description: "Stay connected to your child’s institution journey.",
    icon: Users,
  },
  {
    id: "staff",
    title: "I’m staff",
    description: "Access staff tools and your institution workspace.",
    icon: Building2,
  },
] as const;

export const personalOptions = [
  {
    id: "profile",
    title: "My profile",
    description: "Set up your identity and personal Skuully space.",
    icon: Compass,
  },
  {
    id: "learning",
    title: "Learning",
    description: "Start with courses, study, and knowledge.",
    icon: BookOpen,
  },
  {
    id: "community",
    title: "Community",
    description: "Explore people, ideas, and academic conversations.",
    icon: Users,
  },
] as const;