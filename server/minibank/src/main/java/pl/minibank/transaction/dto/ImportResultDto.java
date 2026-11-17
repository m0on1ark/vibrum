package pl.minibank.transaction.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class ImportResultDto {
    private int importedCount;
    private int skippedDuplicatesCount;
}