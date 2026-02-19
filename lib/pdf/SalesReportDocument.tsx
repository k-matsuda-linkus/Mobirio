// TODO: Install @react-pdf/renderer and implement
// import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

interface Props {
  vendorName: string;
  periodStart: string;
  periodEnd: string;
  totalRevenue: number;
  totalBookings: number;
  dailyData: { date: string; revenue: number; bookings: number }[];
}

export function SalesReportDocument(_props: Props) {
  // Placeholder - will use @react-pdf/renderer
  return null;
}
