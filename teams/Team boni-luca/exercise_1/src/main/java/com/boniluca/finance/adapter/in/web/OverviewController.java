package com.boniluca.finance.adapter.in.web;

import com.boniluca.finance.application.port.in.GetCurrentDebt;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class OverviewController {

    private final GetCurrentDebt getCurrentDebt;

    public OverviewController(GetCurrentDebt getCurrentDebt) {
        this.getCurrentDebt = getCurrentDebt;
    }

    @GetMapping("/")
    public String overview(Model model) {
        model.addAttribute("debt", getCurrentDebt.currentDebt());
        return "overview";
    }
}
