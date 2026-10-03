import { Document, Image, Page, StyleSheet, Text, View } from '@react-pdf/renderer';
import { buildUnitQrCodeUrl } from '../../lib/productIdentity';
import { adminConfig } from '../../config/adminConfig';

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: 'Helvetica',
    color: '#111111',
    backgroundColor: '#FFFFFF',
  },
  header: {
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E7E0D6',
  },
  title: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 10,
    color: '#666666',
    lineHeight: 1.5,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  card: {
    width: '47%',
    borderWidth: 1,
    borderColor: '#DDD5CB',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    alignItems: 'center',
    gap: 8,
  },
  qr: {
    width: 124,
    height: 124,
    backgroundColor: '#FFFFFF',
  },
  label: {
    fontSize: 8,
    color: '#8C6B43',
    letterSpacing: 1.4,
  },
  unitId: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
  },
  code: {
    fontSize: 9,
    color: '#555555',
    textAlign: 'center',
  },
});

const AuthenticityQrSheetPDF = ({ order, units = [], storeConfig = adminConfig }) => {
  const brandName = storeConfig?.storeName || adminConfig.storeName;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>{brandName} Authenticity QR Sheet</Text>
          <Text style={styles.subtitle}>
            QR labels for order {order.id?.slice(0, 8).toUpperCase()} · {order.customer_name || 'Customer'}.
            Attach one label to each physical unit or include it with the matching certificate card.
          </Text>
        </View>

        <View style={styles.grid}>
          {units.map((unit) => (
            <View key={unit.id} style={styles.card}>
              <Image style={styles.qr} src={buildUnitQrCodeUrl(unit)} />
              <Text style={styles.label}>UNIT ID</Text>
              <Text style={styles.unitId}>{unit.public_unit_id}</Text>
              <Text style={styles.code}>{unit.authenticity_code}</Text>
            </View>
          ))}
        </View>
      </Page>
    </Document>
  );
};

export default AuthenticityQrSheetPDF;
