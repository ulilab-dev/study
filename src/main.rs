use eframe::egui;

fn main() -> Result<(), eframe::Error> {
    let options = eframe::NativeOptions::default();

    eframe::run_native(
        "Rust Calculator",
        options,
        Box::new(|_| Ok(Box::new(Calculator::default()))),
    )
}

#[derive(Default)]
struct Calculator {
    expr: String,
}

impl eframe::App for Calculator {
    fn update(&mut self, ctx: &egui::Context, _: &mut eframe::Frame) {
        self.handle_keyboard(ctx);

        egui::CentralPanel::default().show(ctx, |ui| {
            ui.vertical_centered(|ui| {
                ui.heading("Calculator");
            });

            ui.add_space(10.0);

            ui.add(
                egui::TextEdit::singleline(&mut self.expr)
                    .desired_width(f32::INFINITY)
                    .font(egui::TextStyle::Heading),
            );

            ui.add_space(10.0);

            let rows = [
                ["C", "(", ")", "⌫"],
                ["7", "8", "9", "/"],
                ["4", "5", "6", "*"],
                ["1", "2", "3", "-"],
                ["0", ".", "=", "+"],
            ];

            egui::Grid::new("buttons")
                .spacing([8.0, 8.0])
                .show(ui, |ui| {
                    for row in rows {
                        for b in row {
                            if ui
                                .add_sized([60.0, 50.0], egui::Button::new(b))
                                .clicked()
                            {
                                self.press(b);
                            }
                        }
                        ui.end_row();
                    }
                });
        });
    }
}

impl Calculator {
    fn press(&mut self, b: &str) {
        match b {
            "C" => self.expr.clear(),
            "⌫" => {
                self.expr.pop();
            }
            "=" => match evaluate(&self.expr) {
                Ok(v) => self.expr = format_number(v),
                Err(e) => self.expr = e,
            },
            _ => self.expr.push_str(b),
        }
    }

    fn handle_keyboard(&mut self, ctx: &egui::Context) {
        ctx.input(|i| {
            for event in &i.events {
                match event {
                    egui::Event::Text(s) => {
                        for c in s.chars() {
                            if "0123456789+-*/().".contains(c) {
                                self.expr.push(c);
                            }
                        }
                    }

                    egui::Event::Key {
                        key,
                        pressed: true,
                        ..
                    } => match key {
                        egui::Key::Enter => {
                            if let Ok(v) = evaluate(&self.expr) {
                                self.expr = format_number(v);
                            }
                        }
                        egui::Key::Backspace => {
                            self.expr.pop();
                        }
                        egui::Key::Escape => {
                            self.expr.clear();
                        }
                        _ => {}
                    },

                    _ => {}
                }
            }
        });
    }
}

fn format_number(v: f64) -> String {
    if v.fract() == 0.0 {
        format!("{}", v as i64)
    } else {
        format!("{}", v)
    }
}

#[derive(Clone)]
enum Token {
    Num(f64),
    Op(char),
    LParen,
    RParen,
}

fn evaluate(expr: &str) -> Result<f64, String> {
    let tokens = tokenize(expr)?;
    let rpn = shunting_yard(tokens)?;
    eval_rpn(rpn)
}

fn tokenize(s: &str) -> Result<Vec<Token>, String> {
    let chars: Vec<char> = s.chars().collect();
    let mut i = 0;
    let mut out = Vec::new();

    while i < chars.len() {
        let c = chars[i];

        if c.is_whitespace() {
            i += 1;
            continue;
        }

        if c.is_ascii_digit()
            || c == '.'
            || (c == '-'
                && (i == 0
                    || matches!(
                        out.last(),
                        None | Some(Token::Op(_)) | Some(Token::LParen)
                    )))
        {
            let mut num = String::new();

            if c == '-' {
                num.push('-');
                i += 1;
            }

            while i < chars.len() && (chars[i].is_ascii_digit() || chars[i] == '.') {
                num.push(chars[i]);
                i += 1;
            }

            let value: f64 = num.parse().map_err(|_| "Invalid number".to_string())?;
            out.push(Token::Num(value));
            continue;
        }

        match c {
            '+' | '-' | '*' | '/' => out.push(Token::Op(c)),
            '(' => out.push(Token::LParen),
            ')' => out.push(Token::RParen),
            _ => return Err(format!("Unexpected '{}'", c)),
        }

        i += 1;
    }

    Ok(out)
}

fn precedence(op: char) -> i32 {
    match op {
        '+' | '-' => 1,
        '*' | '/' => 2,
        _ => 0,
    }
}

fn shunting_yard(tokens: Vec<Token>) -> Result<Vec<Token>, String> {
    let mut output = Vec::new();
    let mut stack = Vec::<Token>::new();

    for t in tokens {
        match t {
            Token::Num(_) => output.push(t),

            Token::Op(op1) => {
                while let Some(Token::Op(op2)) = stack.last() {
                    if precedence(*op2) >= precedence(op1) {
                        output.push(stack.pop().unwrap());
                    } else {
                        break;
                    }
                }

                stack.push(Token::Op(op1));
            }

            Token::LParen => stack.push(Token::LParen),

            Token::RParen => {
                while let Some(top) = stack.pop() {
                    match top {
                        Token::LParen => break,
                        _ => output.push(top),
                    }
                }
            }
        }
    }

    while let Some(t) = stack.pop() {
        output.push(t);
    }

    Ok(output)
}

fn eval_rpn(tokens: Vec<Token>) -> Result<f64, String> {
    let mut stack = Vec::<f64>::new();

    for t in tokens {
        match t {
            Token::Num(n) => stack.push(n),

            Token::Op(op) => {
                if stack.len() < 2 {
                    return Err("Syntax Error".into());
                }

                let b = stack.pop().unwrap();
                let a = stack.pop().unwrap();

                let r = match op {
                    '+' => a + b,
                    '-' => a - b,
                    '*' => a * b,
                    '/' => {
                        if b == 0.0 {
                            return Err("Division by zero".into());
                        }
                        a / b
                    }
                    _ => unreachable!(),
                };

                stack.push(r);
            }

            _ => {}
        }
    }

    if stack.len() == 1 {
        Ok(stack[0])
    } else {
        Err("Syntax Error".into())
    }
}
