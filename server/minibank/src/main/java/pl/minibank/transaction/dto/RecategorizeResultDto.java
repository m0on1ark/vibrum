package pl.minibank.transaction.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class RecategorizeResultDto {
    private int checkedCount;
    private int changedCount;
}
