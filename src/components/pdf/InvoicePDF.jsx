import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { siteConfig } from '../../config/siteConfig';

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#333333',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 40,
  },
  brandName: {
    fontSize: 24,
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 2,
    marginBottom: 4,
  },
  tagline: {
    fontSize: 9,
    color: '#666666',
    letterSpacing: 1,
    marginBottom: 12,
  },
  companyDetails: {
    fontSize: 9,
    color: '#666666',
    lineHeight: 1.4,
  },
  invoiceTitle: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 8,
    textAlign: 'right',
  },
  invoiceMeta: {
    fontSize: 9,
    textAlign: 'right',
    color: '#666666',
    lineHeight: 1.4,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
    marginBottom: 20,
  },
  addressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 40,
  },
  addressBlock: {
    width: '45%',
  },
  sectionTitle: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#666666',
    marginBottom: 8,
    letterSpacing: 1,
  },
  boldText: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 10,
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
    borderColor: '#EEEEEE',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#F9F9F9',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  tableHeaderCell: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#555555',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  colItem: { width: '40%' },
  colHsn: { width: '20%' },
  colQty: { width: '10%', textAlign: 'center' },
  colUnit: { width: '15%', textAlign: 'right' },
  colTotal: { width: '15%', textAlign: 'right' },
  itemName: {
    fontFamily: 'Helvetica-Bold',
    marginBottom: 2,
  },
  itemDesc: {
    fontSize: 8,
    color: '#666666',
  },
  summaryBlock: {
    width: '50%',
    alignSelf: 'flex-end',
    marginBottom: 40,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  summaryLabel: {
    fontSize: 9,
    color: '#666666',
  },
  summaryValue: {
    fontSize: 9,
    textAlign: 'right',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#333333',
    paddingTop: 8,
    marginTop: 4,
  },
  totalLabel: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
  },
  totalValue: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'right',
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
    paddingTop: 12,
  },
  footerText: {
    fontSize: 8,
    color: '#888888',
    lineHeight: 1.4,
  },
  footerRightText: {
    fontSize: 8,
    color: '#888888',
    textAlign: 'right',
    lineHeight: 1.4,
  },
});

const formatCurrency = (amount, symbol = '₹') => {
  return `${symbol}${Math.round(amount).toLocaleString('en-IN')}`;
};

const InvoicePDF = ({ order, storeConfig = siteConfig }) => {
  const safeOrder = order || {};
  const items = safeOrder.items || [];
  const dateStr = safeOrder.created_at
    ? new Date(safeOrder.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    : 'N/A';

  const brandName = storeConfig?.name || siteConfig.name;
  const brandTagline = storeConfig?.tagline || siteConfig.tagline;
  const supportEmail = storeConfig?.contact?.supportEmail || storeConfig?.contact?.email || siteConfig.contact.email;
  const contactPhone = storeConfig?.contact?.phone || siteConfig.contact.phone;
  const storeAddress = storeConfig?.contact?.address?.formatted || siteConfig.contact.address.formatted;
  const storeDomain = storeConfig?.domain || siteConfig.domain;
  const currencySymbol = storeConfig?.localization?.currencySymbol || '₹';

  const itemsSum = items.reduce((acc, item) => acc + (item.lineTotal || 0), 0);
  const diff = (safeOrder.total || 0) - itemsSum;
  let shipping = 0;
  let discount = 0;
  if (diff > 0) shipping = diff;
  if (diff < 0) discount = Math.abs(diff);

  const shortId = safeOrder.id ? safeOrder.id.slice(0, 8).toUpperCase() : 'XXXX';
  const invoiceNo = `INV-${new Date().getFullYear()}-${shortId}`;
  const address = safeOrder.shipping_address || {};

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.brandName}>{brandName}</Text>
            {brandTagline ? <Text style={styles.tagline}>{brandTagline.toUpperCase()}</Text> : null}
            {supportEmail ? <Text style={styles.companyDetails}>{supportEmail}</Text> : null}
            {contactPhone ? <Text style={styles.companyDetails}>{contactPhone}</Text> : null}
            {storeAddress ? <Text style={styles.companyDetails}>{storeAddress}</Text> : null}
            {storeDomain ? <Text style={styles.companyDetails}>{storeDomain}</Text> : null}
          </View>
          <View>
            <Text style={styles.invoiceTitle}>INVOICE</Text>
            <Text style={styles.invoiceMeta}>Invoice #: {invoiceNo}</Text>
            <Text style={styles.invoiceMeta}>Order ID: {safeOrder.id || 'N/A'}</Text>
            <Text style={styles.invoiceMeta}>Date: {dateStr}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Addresses */}
        <View style={styles.addressRow}>
          <View style={styles.addressBlock}>
            <Text style={styles.sectionTitle}>BILL TO</Text>
            <Text style={styles.boldText}>{safeOrder.customer_name || 'Customer'}</Text>
            <Text style={styles.textLine}>{safeOrder.customer_email}</Text>
            {safeOrder.customer_phone && <Text style={styles.textLine}>Phone: {safeOrder.customer_phone}</Text>}
            <Text style={styles.textLine}>{address.address || 'Address not provided'}</Text>
            {address.city ? <Text style={styles.textLine}>{address.city} — {address.pincode}</Text> : null}
          </View>
          <View style={styles.addressBlock}>
            <Text style={styles.sectionTitle}>SHIP TO</Text>
            <Text style={styles.boldText}>{safeOrder.customer_name || 'Customer'}</Text>
            <Text style={styles.textLine}>{address.address || 'Address not provided'}</Text>
            {address.city ? <Text style={styles.textLine}>{address.city} — {address.pincode}</Text> : null}
            {address.phone && <Text style={styles.textLine}>Phone: {address.phone}</Text>}
          </View>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.tableHeaderCell, styles.colItem]}>ITEM</Text>
            <Text style={[styles.tableHeaderCell, styles.colHsn]}>SKU</Text>
            <Text style={[styles.tableHeaderCell, styles.colQty]}>QTY</Text>
            <Text style={[styles.tableHeaderCell, styles.colUnit]}>UNIT PRICE</Text>
            <Text style={[styles.tableHeaderCell, styles.colTotal]}>TOTAL</Text>
          </View>

          {/* Table Rows */}
          {items.map((item, index) => {
            const total = item.lineTotal || item.price * item.quantity || 0;
            const unitPrice = item.price || total / (item.quantity || 1);
            const sku = item.sku || `SKU-${String(index + 1).padStart(4, '0')}`;

            return (
              <View key={index} style={styles.tableRow}>
                <View style={styles.colItem}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  {item.tagline || item.description ? (
                    <Text style={styles.itemDesc}>{item.tagline || item.description}</Text>
                  ) : null}
                </View>
                <Text style={[styles.textLine, styles.colHsn]}>{sku}</Text>
                <Text style={[styles.textLine, styles.colQty]}>{item.quantity}</Text>
                <Text style={[styles.textLine, styles.colUnit]}>{formatCurrency(unitPrice, currencySymbol)}</Text>
                <Text style={[styles.textLine, styles.colTotal]}>{formatCurrency(total, currencySymbol)}</Text>
              </View>
            );
          })}
        </View>

        {/* Summary */}
        <View style={styles.summaryBlock}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>{formatCurrency(itemsSum, currencySymbol)}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Shipping / Fees</Text>
            <Text style={styles.summaryValue}>{shipping > 0 ? formatCurrency(shipping, currencySymbol) : 'Free'}</Text>
          </View>

          {discount > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Discount</Text>
              <Text style={[styles.summaryValue, { color: '#059669' }]}>-{formatCurrency(discount, currencySymbol)}</Text>
            </View>
          )}

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total paid</Text>
            <Text style={styles.totalValue}>{formatCurrency(safeOrder.total || itemsSum, currencySymbol)}</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View>
            <Text style={styles.footerText}>Payment via: {safeOrder.payment_method || 'Online'}</Text>
            {safeOrder.razorpay_payment_id && (
              <Text style={styles.footerText}>Ref: {safeOrder.razorpay_payment_id}</Text>
            )}
            <Text style={[styles.footerText, { marginTop: 4 }]}>Thank you for choosing {brandName}.</Text>
            {supportEmail ? <Text style={styles.footerText}>Support: {supportEmail}</Text> : null}
          </View>
          <View>
            <Text style={styles.footerRightText}>This is a computer-generated invoice.</Text>
            <Text style={styles.footerRightText}>No signature required.</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
};

export default InvoicePDF;
