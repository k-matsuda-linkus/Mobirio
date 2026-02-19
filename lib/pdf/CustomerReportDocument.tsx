// TODO: Install @react-pdf/renderer and implement
// import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

interface Props {
  vendorName: string;
  periodStart: string;
  periodEnd: string;
  customers: {
    id: string;
    name: string;
    email: string;
    totalBookings: number;
    totalSpent: number;
    lastBookingDate: string;
  }[];
}

export function CustomerReportDocument(_props: Props) {
  // Placeholder - will use @react-pdf/renderer
  return null;
}
