// This is your data source.
// In a real-world application, this would likely come from an API call (e.g., fetch('api/genes')).
// For this example, it's a simple JSON object.
const geneData = {
    "BRCA1": {
        "fullName": "Breast Cancer Gene 1",
        "chromosome": "17q21.31",
        "summary": "Associated with hereditary breast and ovarian cancer. Mutations significantly increase the risk of developing these cancers.",
        "variants": [
            {
                "id": "rs1799950",
                "hgvs": "c.4484G>C",
                "type": "SNP",
                "clinicalSignificance": "Benign",
                "alleleFrequency": "G=0.58, C=0.42 (in 1000 Genomes)",
                "notes": "A common polymorphism with no proven direct link to cancer risk, but studied extensively."
            },
            {
                "id": "185delAG",
                "hgvs": "c.68_69delAG",
                "type": "Deletion",
                "clinicalSignificance": "Pathogenic",
                "alleleFrequency": "Rare, but more common in Ashkenazi Jewish populations.",
                "notes": "A well-known founder mutation that disrupts the protein and increases cancer risk."
            }
        ]
    },
    "TP53": {
        "fullName": "Tumor Protein P53",
        "chromosome": "17p13.1",
        "summary": "A tumor suppressor gene, often called the 'guardian of the genome'. Germline mutations are associated with Li-Fraumeni syndrome.",
        "variants": [
            {
                "id": "rs1042522",
                "hgvs": "c.215C>G",
                "type": "SNP",
                "clinicalSignificance": "Conflicting interpretations of pathogenicity",
                "alleleFrequency": "C=0.25, G=0.75 (in 1000 Genomes)",
                "notes": "This is a common missense variant (Pro72Arg). The Arg variant has been controversially linked to cancer risk."
            }
        ]
    },
    "CFTR": {
        "fullName": "Cystic Fibrosis Transmembrane Conductance Regulator",
        "chromosome": "7q31.2",
        "summary": "Mutations in this gene cause cystic fibrosis (CF) and related disorders.",
        "variants": [
            {
                "id": "F508del",
                "hgvs": "c.1521_1523delCTT",
                "type": "Deletion",
                "clinicalSignificance": "Pathogenic",
                "alleleFrequency": "Most common CF-causing mutation worldwide.",
                "notes": "Results in the deletion of a Phenylalanine at position 508, causing protein misfolding and degradation."
            }
        ]
    }
};

$(document).ready(function() {
    // --- 1. INITIALIZATION ---

    const $geneSelector = $('#gene-selector');
    const $variantForm = $('#variant-form');
    const $variantInput = $('#variant-input');
    const $resultsContainer = $('#results-container');
    const initialResultsHTML = $resultsContainer.html(); // Save initial state

    // Populate the gene selector dropdown
    const genes = Object.keys(geneData).sort();
    genes.forEach(gene => {
        $geneSelector.append(new Option(gene, gene));
    });

    // Initialize the Select2 library on our dropdown
    $geneSelector.select2({
        theme: "bootstrap-5",
        width: '100%',
    });

    // --- 2. EVENT HANDLING ---

    // Handle form submission
    $variantForm.on('submit', function(e) {
        e.preventDefault(); // Prevent page reload
        
        const selectedGene = $geneSelector.val();
        const variantId = $variantInput.val().trim();

        // Basic validation
        if (!selectedGene || !variantId) {
            displayError("Please select a gene and enter a variant ID.");
            return;
        }

        searchAndDisplay(selectedGene, variantId);
    });

    // --- 3. CORE FUNCTIONS ---

    function searchAndDisplay(gene, variantId) {
        const geneInfo = geneData[gene];
        if (!geneInfo) {
            displayNotFound("Gene not found in the database.");
            return;
        }

        // Case-insensitive search for the variant
        const foundVariant = geneInfo.variants.find(
            variant => variant.id.toLowerCase() === variantId.toLowerCase()
        );

        if (foundVariant) {
            displayVariantData(foundVariant, geneInfo);
        } else {
            displayNotFound(`Variant '${variantId}' was not found for gene ${gene}.`);
        }
    }

    // --- 4. DISPLAY FUNCTIONS ---

    function displayVariantData(variant, gene) {
        const significanceClass = getSignificanceClass(variant.clinicalSignificance);
        const html = `
            <div class="card shadow-sm results-card">
                <div class="card-header bg-white">
                    <h3 class="mb-0">${variant.id} <small class="text-muted">in ${gene.fullName} (${Object.keys(geneData).find(key => geneData[key] === gene)})</small></h3>
                </div>
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-6">
                            <h5>Variant Details</h5>
                            <dl class="row">
                                <dt class="col-sm-5">HGVS Nomenclature</dt>
                                <dd class="col-sm-7">${variant.hgvs || 'N/A'}</dd>
                                
                                <dt class="col-sm-5">Type</dt>
                                <dd class="col-sm-7">${variant.type || 'N/A'}</dd>
                                
                                <dt class="col-sm-5">Allele Frequency</dt>
                                <dd class="col-sm-7">${variant.alleleFrequency || 'N/A'}</dd>
                            </dl>
                        </div>
                        <div class="col-md-6">
                            <h5>Clinical Interpretation</h5>
                             <dl class="row">
                                <dt class="col-sm-5">Significance</dt>
                                <dd class="col-sm-7"><span class="badge ${significanceClass}">${variant.clinicalSignificance || 'Unknown'}</span></dd>

                                <dt class="col-sm-5">Notes</dt>
                                <dd class="col-sm-7">${variant.notes || 'No notes available.'}</dd>
                             </dl>
                        </div>
                    </div>
                    <hr>
                    <h5>Gene Context: ${gene.fullName}</h5>
                    <p class="text-muted">${gene.summary || 'No summary available.'}</p>
                </div>
            </div>
        `;
        $resultsContainer.html(html);
    }
    
    function displayNotFound(message) {
        const html = `
            <div class="alert alert-warning text-center" role="alert">
                <strong>Not Found:</strong> ${message}
            </div>
        `;
        $resultsContainer.html(html);
    }

    function displayError(message) {
        const html = `
            <div class="alert alert-danger text-center" role="alert">
                <strong>Error:</strong> ${message}
            </div>
        `;
        $resultsContainer.html(html);
    }

    function getSignificanceClass(significance) {
        const lowerCaseSig = significance.toLowerCase();
        if (lowerCaseSig === 'pathogenic') return 'bg-danger';
        if (lowerCaseSig === 'benign') return 'bg-success';
        if (lowerCaseSig.includes('conflicting')) return 'bg-warning text-dark';
        return 'bg-secondary';
    }

});
