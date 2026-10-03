import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { adminConfig } from '../../config/adminConfig';

export const packingSlipStyles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: '#000000',
    backgroundColor: '#FFFFFF',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 30,
    borderBottomWidth: 1,
    borderBottomColor: '#000000',
    paddingBottom: 20,
  },
  brandName: {
    fontSize: 20,
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 2,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 8,
    color: '#666666',
    letterSpacing: 1,
  },
  orderTitle: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'right',
    marginBottom: 4,
  },
  orderMeta: {
    fontSize: 8,
    color: '#666666',
    textAlign: 'right',
    lineHeight: 1.4,
  },
  addressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  addressBlock: {
    width: '45%',
    backgroundColor: '#FAFAFA',
    padding: 12,
    borderWidth: 1,
    borderColor: '#EEEEEE',
    borderRadius: 4,
  },
  sectionTitle: {
    fontSize: 8,
    color: '#666666',
    marginBottom: 8,
    letterSpacing: 1,
  },
  boldText: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 11,
    marginBottom: 4,
  },
  textLine: {
    marginBottom: 4,
    lineHeight: 1.4,
  },
  table: {
    width: '100%',
    marginBottom: 30,
    borderWidth: 1,
    borderColor: '#D4D4D4',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#D4D4D4',
    backgroundColor: '#F5F5F5',
  },
  tableHeaderCell: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    padding: 8,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  colItem: { width: '60%', padding: 8, borderRightWidth: 1, borderRightColor: '#D4D4D4' },
  colSku: { width: '25%', padding: 8, borderRightWidth: 1, borderRightColor: '#D4D4D4', textAlign: 'center' },
  colQty: { width: '15%', padding: 8, textAlign: 'center' },
  itemName: {
    fontFamily: 'Helvetica-Bold',
    marginBottom: 4,
  },
  itemDesc: {
    fontSize: 8,
    color: '#666666',
  },
  checklist: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 8,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  checklistBox: {
    width: 10,
    height: 10,
    borderWidth: 1,
    borderColor: '#666666',
  },
  checklistText: {
    fontSize: 8,
    color: '#666666',
  },
  totalRow: {
    backgroundColor: '#FAFAFA',
    borderTopWidth: 1,
    borderTopColor: '#000000',
  },
  notesBox: {
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: '#EEEEEE',
    padding: 12,
    borderRadius: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 40,
  },
  notesText: {
    width: '70%',
    lineHeight: 1.5,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopStyle: 'dashed',
    borderTopColor: '#000000',
    paddingTop: 12,
  },
  footerText: {
    fontSize: 8,
    color: '#666666',
  },
});

function getPackingSlipData(order) {
  const safeOrder = order || {};
  const items = safeOrder.items || [];
  const dateStr = safeOrder.created_at
    ? new Date(safeOrder.created_at).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : 'N/A';

  const shortId = safeOrder.id ? safeOrder.id.slice(0, 8).toUpperCase() : 'XXXX';
  const displayId = `PKG-${new Date().getFullYear()}-${shortId}`;
  const address = safeOrder.shipping_address || {};
  const totalQty = items.reduce((acc, item) => acc + (item.quantity || 1), 0);

  return { safeOrder, items, dateStr, displayId, address, totalQty };
}

export function PackingSlipPage({ order, storeConfig = adminConfig }) {
  const { safeOrder, items, dateStr, displayId, address, totalQty } = getPackingSlipData(order);

  const brandName = storeConfig?.storeName || adminConfig.storeName;
  const brandTagline = storeConfig?.tagline || adminConfig.tagline;
  const supportEmail = storeConfig?.contact?.supportEmail || storeConfig?.contact?.email || adminConfig.contact.email;
  const contactPhone = storeConfig?.contact?.phone || adminConfig.contact.phone;
  const storeAddress = storeConfig?.contact?.address?.formatted || adminConfig.contact.address.formatted;
  const storeDomain = storeConfig?.storefrontUrl || adminConfig.storefrontUrl;

  return (
    <Page size="A4" style={packingSlipStyles.page}>
      <View style={packingSlipStyles.headerRow}>
        <View>
          <Text style={packingSlipStyles.brandName}>PACKING SLIP</Text>
          <Text style={packingSlipStyles.subtitle}>{brandName} — {brandTagline}</Text>
        </View>
        <View>
          <Text style={packingSlipStyles.orderTitle}>Order #{displayId}</Text>
          <Text style={packingSlipStyles.orderMeta}>{dateStr}</Text>
          <Text style={packingSlipStyles.orderMeta}>Status: Dispatched / Ready for Courier</Text>
        </View>
      </View>

      <View style={packingSlipStyles.addressRow}>
        <View style={packingSlipStyles.addressBlock}>
          <Text style={packingSlipStyles.sectionTitle}>SHIP FROM</Text>
          <Text style={packingSlipStyles.boldText}>{brandName}</Text>
          <Text style={packingSlipStyles.textLine}>{storeAddress}</Text>
          {contactPhone ? <Text style={packingSlipStyles.textLine}>Contact: {contactPhone}</Text> : null}
        </View>
        <View style={packingSlipStyles.addressBlock}>
          <Text style={packingSlipStyles.sectionTitle}>SHIP TO</Text>
          <Text style={packingSlipStyles.boldText}>{safeOrder.customer_name || 'Customer'}</Text>
          <Text style={packingSlipStyles.textLine}>{address.address || 'Address not provided'}</Text>
          {address.city ? (
            <Text style={packingSlipStyles.textLine}>
              {address.city} - {address.pincode}
            </Text>
          ) : null}
          {address.phone ? <Text style={packingSlipStyles.textLine}>Phone: {address.phone}</Text> : null}
        </View>
      </View>

      <View style={packingSlipStyles.table}>
        <View style={packingSlipStyles.tableHeaderRow}>
          <Text style={[packingSlipStyles.tableHeaderCell, packingSlipStyles.colItem]}>ITEM</Text>
          <Text style={[packingSlipStyles.tableHeaderCell, packingSlipStyles.colSku]}>SKU</Text>
          <Text style={[packingSlipStyles.tableHeaderCell, packingSlipStyles.colQty]}>QTY</Text>
        </View>

        {items.map((item, index) => {
          const sku = item.sku || `SKU-${String(index + 1).padStart(4, '0')}`;

          return (
            <View key={`${item.name || 'item'}-${index}`} style={packingSlipStyles.tableRow}>
              <View style={packingSlipStyles.colItem}>
                <Text style={packingSlipStyles.itemName}>{item.name}</Text>
                {item.tagline || item.description ? (
                  <Text style={packingSlipStyles.itemDesc}>{item.tagline || item.description}</Text>
                ) : null}
              </View>
              <View style={[packingSlipStyles.colSku, { justifyContent: 'center' }]}>
                <Text>{sku}</Text>
              </View>
              <View style={[packingSlipStyles.colQty, { justifyContent: 'center' }]}>
                <Text>{item.quantity || 1}</Text>
              </View>
            </View>
          );
        })}

        <View style={[packingSlipStyles.tableRow, packingSlipStyles.totalRow, { borderBottomWidth: 0 }]}>
          <View style={[packingSlipStyles.colItem, { paddingVertical: 12 }]}>
            <Text style={packingSlipStyles.itemName}>Total items</Text>
          </View>
          <View style={[packingSlipStyles.colSku, { paddingVertical: 12 }]} />
          <View style={[packingSlipStyles.colQty, { paddingVertical: 12, justifyContent: 'center' }]}>
            <Text style={{ fontFamily: 'Helvetica-Bold' }}>{totalQty}</Text>
          </View>
        </View>
      </View>

      <View style={packingSlipStyles.notesBox}>
        <View style={packingSlipStyles.notesText}>
          <Text style={packingSlipStyles.sectionTitle}>PACKING NOTES &amp; QUALITY INSPECTION</Text>
          <Text>
            Carefully packaged item. Wrap with protective cushioning. Ensure package is sealed securely against moisture during transit.
          </Text>
          <View style={packingSlipStyles.checklist}>
            <View style={packingSlipStyles.checklistItem}>
              <View style={packingSlipStyles.checklistBox} />
              <Text style={packingSlipStyles.checklistText}>Item verified</Text>
            </View>
            <View style={packingSlipStyles.checklistItem}>
              <View style={packingSlipStyles.checklistBox} />
              <Text style={packingSlipStyles.checklistText}>Cushioning confirmed</Text>
            </View>
            <View style={packingSlipStyles.checklistItem}>
              <View style={packingSlipStyles.checklistBox} />
              <Text style={packingSlipStyles.checklistText}>Securely sealed</Text>
            </View>
          </View>
        </View>
        <View style={{ alignItems: 'center' }}>
          <Image 
            src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${displayId}`} 
            style={{ width: 40, height: 40, marginBottom: 4 }} 
          />
          <Text style={{ fontSize: 7, color: '#666666', letterSpacing: 1 }}>ORDER CODE</Text>
        </View>
      </View>

      <View style={packingSlipStyles.footer}>
        <View>
          <Text style={{ fontFamily: 'Helvetica-Bold', marginBottom: 4 }}>{brandName}</Text>
          <Text style={packingSlipStyles.footerText}>{brandTagline}</Text>
        </View>
        <View>
          <Text style={[packingSlipStyles.footerText, { textAlign: 'right', marginBottom: 4 }]}>
            {supportEmail} {contactPhone ? `| ${contactPhone}` : ''}
          </Text>
          <Text style={[packingSlipStyles.footerText, { textAlign: 'right' }]}>{storeDomain}</Text>
        </View>
      </View>
    </Page>
  );
}

const PackingSlipPDF = ({ order, storeConfig = adminConfig }) => (
  <Document>
    <PackingSlipPage order={order} storeConfig={storeConfig} />
  </Document>
);

export default PackingSlipPDF;
