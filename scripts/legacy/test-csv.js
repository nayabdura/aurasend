const { parse } = require('csv-parse/sync');

const data = `name\temail
There\tEmily@campingcomfortably.com
There\tsales@bitrebels.com`;

try {
    const records = parse(data, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        bom: true,
        delimiter: [',', '\t', ';']
    });
    console.log('SUCCESS:', records);
} catch (e) {
    console.error('ERROR:', e.message);
}
