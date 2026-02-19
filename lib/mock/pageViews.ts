export interface MockPageView {
  id: string;
  vendor_id: string | null;
  bike_id: string | null;
  page_type: string;
  device_type: string;
  viewed_at: string;
}

function generatePageViews(): MockPageView[] {
  const views: MockPageView[] = [];
  const vendors = ['v-001', 'v-002', 'v-003'];
  const bikes = ['bike-001', 'bike-002', 'bike-003', 'bike-004', 'bike-005', 'bike-006', 'bike-007', 'bike-008'];
  const pageTypes = ['shop', 'bike_detail', 'search', 'top'];
  const devices = ['desktop', 'mobile', 'tablet'];
  let id = 1;

  for (let day = 1; day <= 28; day++) {
    const date = `2026-02-${String(day).padStart(2, '0')}`;
    const dailyCount = 10 + Math.floor(Math.random() * 30);
    for (let j = 0; j < dailyCount; j++) {
      const pageType = pageTypes[Math.floor(Math.random() * pageTypes.length)];
      const device = devices[Math.floor(Math.random() * devices.length)];
      const hour = 8 + Math.floor(Math.random() * 14);
      views.push({
        id: `pv-${String(id++).padStart(4, '0')}`,
        vendor_id: pageType === 'shop' || pageType === 'bike_detail'
          ? vendors[Math.floor(Math.random() * vendors.length)]
          : null,
        bike_id: pageType === 'bike_detail'
          ? bikes[Math.floor(Math.random() * bikes.length)]
          : null,
        page_type: pageType,
        device_type: device,
        viewed_at: `${date}T${String(hour).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}:00`,
      });
    }
  }
  return views;
}

export const mockPageViews: MockPageView[] = generatePageViews();
