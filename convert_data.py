
import pandas as pd
import json
import argparse

def convert_excel_to_json(input_path, output_path, gene_column="Gene"):
    """
    Reads an Excel file and converts its data to a JSON format suitable for the web app.
    """
    try:
        df = pd.read_excel(input_path)
    except FileNotFoundError:
        print(f"Error: Input file not found at {input_path}")
        return
    except Exception as e:
        print(f"Error reading Excel file: {e}")
        return

    if gene_column not in df.columns:
        print(f"Error: Gene column '{gene_column}' not found. Available columns: {list(df.columns)}")
        return

    processed_data = {}
    # Replace pandas' Not a Time (NaT) and Not a Number (NaN) with None for JSON compatibility
    df = df.where(pd.notna(df), None)

    for _, row in df.iterrows():
        gene_name = row.get(gene_column)
        if not gene_name:
            print(f"Warning: Skipping row with missing gene name in column '{gene_column}'.")
            continue

        if gene_name not in processed_data:
            processed_data[gene_name] = {"fullName": "", "chromosome": "", "summary": "", "variants": []}

        variant_data = row.to_dict()
        for key, value in variant_data.items():
            if isinstance(value, pd.Timestamp):
                variant_data[key] = value.isoformat()
        
        if gene_column in variant_data:
            del variant_data[gene_column]

        processed_data[gene_name]["variants"].append(variant_data)

    try:
        # Write with UTF-8 encoding and ensure_ascii=False to handle special characters correctly
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(processed_data, f, indent=4, ensure_ascii=False)
        print(f"Successfully converted '{input_path}' to '{output_path}'")

    except Exception as e:
        print(f"Error writing JSON file: {e}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Convert variant data from an Excel file to a JSON format.",
        formatter_class=argparse.RawTextHelpFormatter
    )
    parser.add_argument("input_file", help="Path to the input Excel file (.xlsx).")
    parser.add_argument("output_file", help="Path to the output JSON file (e.g., data.json).")
    parser.add_argument("--gene-column", default="Gene", help="Name of the column containing the gene symbol.")
    
    args = parser.parse_args()
    
    convert_excel_to_json(args.input_file, args.output_file, args.gene_column)
