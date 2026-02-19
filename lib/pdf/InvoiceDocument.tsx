// TODO: Install @react-pdf/renderer and implement
// import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

interface Props {
  invoiceNumber: string;
  vendorName: string;
  customerName: string;
  items: { description: string; quantity: number; unitPrice: number; total: number }[];
  subtotal: number;
  tax: number;
  total: number;
  issueDate: string;
  dueDate: string;
}

export function InvoiceDocument(_props: Props) {
  // Placeholder - will use @react-pdf/renderer
  return null;
}
