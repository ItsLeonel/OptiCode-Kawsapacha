"""Generate the local catalogue from the unmodified INEC DPA 2026 workbook.

Usage: python scripts/import-dpa.py path/to/cdpa2026.xlsx
Requires openpyxl. Does not fetch or infer territorial divisions.
"""
import hashlib
import json
from pathlib import Path
import sys

import openpyxl

source = Path(sys.argv[1])
workbook = openpyxl.load_workbook(source, read_only=True, data_only=True)
provinces = {}
cantons = {}
parishes = {}
excluded = []

for row in workbook['PROVINCIAS'].values:
    code = str(row[1])
    if code.isdigit() and len(code) == 2 and code != '90':
        provinces[code] = {'code': code, 'name': row[2].strip()}

for row in workbook['CANTONES'].values:
    code, parent = str(row[3]), str(row[1])
    if code.isdigit() and len(code) == 4:
        record = {'code': code, 'name': row[4].strip(), 'provinceCode': parent}
        if parent in provinces:
            assert code.startswith(parent)
            assert code not in cantons
            cantons[code] = record
        else:
            excluded.append(record)

# CODIGOS contains the cantonal seats and rural parishes; PARROQUIAS
# additionally provides the official urban parish codes in DPA_PARURB.
for sheet, code_column, name_column in [('CODIGOS', 5, 6), ('PARROQUIAS', 7, 8)]:
    for row in workbook[sheet].values:
        code, parent = str(row[code_column]), str(row[3])
        if code.isdigit() and len(code) == 6 and parent in cantons:
            assert code.startswith(parent)
            record = {'code': code, 'name': row[name_column].strip(), 'cantonCode': parent}
            assert code not in parishes or parishes[code] == record
            parishes[code] = record

assert len(provinces) == 24
assert all(any(p['cantonCode'] == c for p in parishes.values()) for c in cantons)
catalogue = {
    'source': 'https://aplicaciones2.ecuadorencifras.gob.ec/SIN/descargas/cdpa2026.xlsx',
    'version': 'DPA 2026',
    'sha256': hashlib.sha256(source.read_bytes()).hexdigest(),
    'excludedStudyZones': excluded,
    'provinces': list(provinces.values()),
    'cantons': list(cantons.values()),
    'parishes': list(parishes.values()),
}
target = Path(__file__).resolve().parents[1] / 'src/features/real-gardens/data/dpa-2026.json'
target.parent.mkdir(parents=True, exist_ok=True)
target.write_text(json.dumps(catalogue, ensure_ascii=False, separators=(',', ':')) + '\n', encoding='utf-8')
print(json.dumps({key: len(catalogue[key]) for key in ['provinces', 'cantons', 'parishes']}))
print('SHA-256:', catalogue['sha256'])
