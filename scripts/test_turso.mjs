import { createClient } from '@libsql/client';

const client = createClient({
    url: 'libsql://hdfc-fleet-pragadeesh123ps.aws-ap-south-1.turso.io',
    authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODY5NzIwMDEsImlkIjoiMDFhMDBmYzktYTQwMS03YTQ2LWE0YWEtNjVhYzlmZjBlZDNiIiwia2lkIjoiNEY2Y01HOEVqamtjRE8tODRYdHRaN0Y2aTVIVEg0SmlpazF6bUVzeXd0dyIsInJpZCI6ImU3ZmY4NjllLTEyOWEtNDI4Ny1hNjY4LTNhNDQzMWVlODNiYiJ9.5k_bSNvdcQNMklpACg8eLugP6XLyW9KncbuUOUuTX_AwFF-qkMdDoQ-srcwCknwxVZ0t-BcVokxbsnP4ankqBQ'
});

async function main() {
    await client.execute(`CREATE TABLE IF NOT EXISTS test_tb (id INTEGER PRIMARY KEY, msg TEXT)`);
    await client.execute(`INSERT INTO test_tb(msg) VALUES('Turso Connection Successful!')`);
    const res = await client.execute(`SELECT * FROM test_tb`);
    console.log('Turso DB Result:', res.rows);
}

main().catch(err => console.error('Turso Error:', err));
