import { Document, Image, Page, StyleSheet, Text, View } from '@react-pdf/renderer';
import { buildUnitQrCodeUrl } from '../../lib/productIdentity';
import { adminConfig } from '../../config/adminConfig';

const styles = StyleSheet.create({
  page: {
    padding: 42,
    fontFamily: 'Helvetica',
    color: '#111111',
    backgroundColor: '#F8F4EE',
  },
  frame: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#C7B08D',
    borderRadius: 18,
    padding: 28,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    gap: 8,
  },
  eyebrow: {
    fontSize: 9,
    letterSpacing: 2,
    color: '#8C6B43',
  },
  brand: {
    fontSize: 24,
    letterSpacing: 6,
    fontFamily: 'Helvetica-Bold',
  },
  title: {
    fontSize: 20,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 11,
    color: '#5B5B5B',
    textAlign: 'center',
    lineHeight: 1.6,
  },
  productBlock: {
    alignItems: 'center',
    gap: 10,
  },
  productName: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
  },
  unitMetaRow: {
    flexDirection: 'row',
    gap: 18,
    justifyContent: 'center',
    marginTop: 8,
  },
  unitMetaCard: {
    width: 145,
    padding: 12,
    borderWidth: 1,
    borderColor: '#D8C5A4',
    borderRadius: 12,
    backgroundColor: '#FFFDFC',
    gap: 6,
  },
  metaLabel: {
    fontSize: 8,
    color: '#8C6B43',
    letterSpacing: 1.5,
  },
  metaValue: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
  },
  qrWrap: {
    alignItems: 'center',
    gap: 10,
  },
  qrImage: {
    width: 172,
    height: 172,
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
  },
  qrCaption: {
    fontSize: 10,
    color: '#5B5B5B',
  },
  footer: {
    gap: 6,
  },
  footerText: {
    fontSize: 10,
    color: '#5B5B5B',
    textAlign: 'center',
    lineHeight: 1.6,
  },
});

function CertificatePage({ order, productMap, unit, storeConfig = adminConfig }) {
  const product = productMap.get(unit.product_id);
  const qrUrl = buildUnitQrCodeUrl(unit);
  const brandName = storeConfig?.storeName || adminConfig.storeName;
  const domain = storeConfig?.storefrontUrl || adminConfig.storefrontUrl;

  return (
    <Page size="A4" style={styles.page}>
      <View style={styles.frame}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>{brandName.toUpperCase()} REGISTERED AUTHENTICITY</Text>
          <Text style={styles.brand}>{brandName}</Text>
          <Text style={styles.title}>Certificate of Authenticity</Text>
          <Text style={styles.subtitle}>
            This certificate confirms that the physical unit listed below is part of the official{' '}
            {brandName} registry and was issued for a genuine product release.
          </Text>
        </View>

        <View style={styles.productBlock}>
          <Text style={styles.productName}>{product?.name || `${brandName} Registered Unit`}</Text>
          <View style={styles.unitMetaRow}>
            <View style={styles.unitMetaCard}>
              <Text style={styles.metaLabel}>UNIT ID</Text>
              <Text style={styles.metaValue}>{unit.public_unit_id}</Text>
            </View>
            <View style={styles.unitMetaCard}>
              <Text style={styles.metaLabel}>AUTH CODE</Text>
              <Text style={styles.metaValue}>{unit.authenticity_code}</Text>
            </View>
            <View style={styles.unitMetaCard}>
              <Text style={styles.metaLabel}>ORDER</Text>
              <Text style={styles.metaValue}>{order.id?.slice(0, 8).toUpperCase()}</Text>
            </View>
          </View>
        </View>

        <View style={styles.qrWrap}>
          <Image style={styles.qrImage} src={qrUrl} />
          <Text style={styles.qrCaption}>Scan to verify this exact registered unit online at {domain.replace(/^https?:\/\//, '')}</Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Issued to {order.customer_name || 'Customer'} for order {order.id?.slice(0, 8).toUpperCase()}.
          </Text>
          <Text style={styles.footerText}>
            Each unit carries its own unique certificate and can be independently verified.
          </Text>
        </View>
      </View>
    </Page>
  );
}

const AuthenticityCertificatePDF = ({ order, units = [], products = [], storeConfig = adminConfig }) => {
  const productMap = new Map(products.map((product) => [product.id, product]));

  return (
    <Document>
      {units.map((unit) => (
        <CertificatePage
          key={unit.id}
          order={order}
          productMap={productMap}
          unit={unit}
          storeConfig={storeConfig}
        />
      ))}
    </Document>
  );
};

export default AuthenticityCertificatePDF;
