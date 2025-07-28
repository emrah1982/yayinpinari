const { Connection, Record } = require('node-z3950');

class Z3950Service {
  constructor() {
    this.defaultConfig = {
      host: process.env.Z3950_HOST || 'z3950.loc.gov',
      port: process.env.Z3950_PORT || 7090,
      database: process.env.Z3950_DATABASE || 'VOYAGER',
      user: process.env.Z3950_USER || 'anonymous',
      password: process.env.Z3950_PASSWORD || 'anonymous',
      elementSetName: 'F',
      preferredRecordSyntax: 'USMARC'
    };
  }

  async connect(config = {}) {
    const connectionConfig = { ...this.defaultConfig, ...config };
    return new Promise((resolve, reject) => {
      const connection = new Connection(connectionConfig);
      connection.on('error', (err) => reject(err));
      connection.on('connect', () => resolve(connection));
      connection.connect();
    });
  }

  async search(query, page = 1, limit = 10, config = {}) {
    let connection;
    try {
      connection = await this.connect(config);
      
      const startRecord = (page - 1) * limit + 1;
      const results = await new Promise((resolve, reject) => {
        connection.search(query, startRecord, limit, (err, result) => {
          if (err) reject(err);
          else resolve(result);
        });
      });

      const records = await Promise.all(
        results.records.map(record => this._parseRecord(record))
      );

      return {
        total: results.size,
        page,
        limit,
        results: records
      };

    } catch (error) {
      console.error('Z39.50 Search Error:', error.message);
      throw error;
    } finally {
      if (connection) {
        connection.close();
      }
    }
  }

  async _parseRecord(record) {
    return new Promise((resolve, reject) => {
      record.parse((err, data) => {
        if (err) reject(err);
        else {
          resolve(this._formatMARCRecord(data));
        }
      });
    });
  }

  _formatMARCRecord(record) {
    const getField = (tag) => {
      return record.fields.find(f => f.tag === tag)?.subfields?.map(sf => sf.value).join(' ') || '';
    };

    const getFields = (tag) => {
      return record.fields
        .filter(f => f.tag === tag)
        .map(f => f.subfields?.map(sf => sf.value).join(' '))
        .filter(Boolean);
    };

    return {
      id: getField('001'),
      title: getField('245'),
      authors: getFields('100').concat(getFields('700')),
      publisher: getField('260'),
      publicationYear: getField('260')?.match(/\d{4}/)?.[0] || '',
      isbn: getFields('020'),
      subjects: getFields('650'),
      classification: {
        ddc: getField('082'),
        lcc: getField('050')
      },
      physicalDescription: getField('300'),
      notes: getFields('500'),
      language: getField('041') || getField('008')?.substring(35, 38),
      format: getField('338'),
      series: getField('440') || getField('490'),
      electronicAccess: getFields('856').map(url => ({
        url: url.match(/http[s]?:\/\/[^\s]+/)?.[0] || '',
        note: url.replace(/http[s]?:\/\/[^\s]+/, '').trim()
      }))
    };
  }

  async searchMultipleServers(query, servers, page = 1, limit = 10) {
    const results = await Promise.allSettled(
      servers.map(async server => {
        try {
          const result = await this.search(query, page, limit, server);
          return {
            server: server.name || server.host,
            ...result
          };
        } catch (error) {
          console.error(`Z39.50 Error for server ${server.name || server.host}:`, error.message);
          return {
            server: server.name || server.host,
            error: error.message,
            total: 0,
            page,
            limit,
            results: []
          };
        }
      })
    );

    return results.map(result => result.value || {
      server: result.reason?.server || 'Unknown',
      error: result.reason?.message || 'Unknown error',
      total: 0,
      page,
      limit,
      results: []
    });
  }
}

module.exports = new Z3950Service();
