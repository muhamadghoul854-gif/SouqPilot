import { z } from "zod";

export const RegisterSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(8).max(128),
  fullName: z.string().min(2).max(100).trim(),
  role: z.enum(["buyer", "seller"]).default("buyer"),
});

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const ProductSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().max(5000).optional(),
  category: z.enum(["ebook", "course", "software", "template", "other"]),
  price: z.number().positive().max(99999),
  currency: z.string().length(3).default("USD"),
  contentType: z.string(),
  downloadLimit: z.number().int().min(1).max(100).default(5),
});

export const CheckoutSchema = z.object({
  productId: z.string().uuid(),
  provider: z.enum(["stripe", "paypal"]).default("stripe"),
});
